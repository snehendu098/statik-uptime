import { randomUUIDv7, type ServerWebSocket } from "bun";
import type { IncomingMessage, SignupIncomingMessage } from "common/types";
import { prismaClient } from "db/client";

const availableValidators: { validatorId: string, socket: ServerWebSocket<unknown>, publicKey: string }[] = [];

const CALLBACKS : { [callbackId: string]: (data: IncomingMessage) => void } = {}
const COST_PER_VALIDATION = 100;

Bun.serve({
    fetch(req, server) {
      if (server.upgrade(req)) {
        return;
      }
      return new Response("Upgrade failed", { status: 500 });
    },
    port: 8081,
    websocket: {
        async message(ws: ServerWebSocket<unknown>, message: string) {

            console.log(message)

            const data: IncomingMessage = JSON.parse(message);

            
            if (data.type === 'signup') {

                    await signupHandler(ws, data.data);
                
            } else if (data.type === 'validate') {
                CALLBACKS[data.data.callbackId](data);
                delete CALLBACKS[data.data.callbackId];
            }
        },
        async close(ws: ServerWebSocket<unknown>) {
            availableValidators.splice(availableValidators.findIndex(v => v.socket === ws), 1);
        },
        async open(ws: ServerWebSocket<unknown>) {
            console.log("New connection established");
        }
    },
});

async function signupHandler(ws: ServerWebSocket<unknown>, { ip, publicKey, callbackId }: SignupIncomingMessage) {
    const validatorDb = await prismaClient.validator.findFirst({
        where: {
            publicKey,
        },
    });

    if (validatorDb) {
        ws.send(JSON.stringify({
            type: 'signup',
            data: {
                validatorId: validatorDb.id,
                callbackId,
            },
        }));

        availableValidators.push({
            validatorId: validatorDb.id,
            socket: ws,
            publicKey: validatorDb.publicKey,
        });
        return;
    }
    
    //TODO: Given the ip, return the location
    const validator = await prismaClient.validator.create({
        data: {
            ip,
            publicKey,
            location: 'unknown',
        },
    });

    ws.send(JSON.stringify({
        type: 'signup',
        data: {
            validatorId: validator.id,
            callbackId,
        },
    }));

    availableValidators.push({
        validatorId: validator.id,
        socket: ws,
        publicKey: validator.publicKey,
    });
}

setInterval(async () => {

    console.log("websites")

    const websitesToMonitor = await prismaClient.website.findMany({
        where: {
            disabled: false,
        },
    });

    for (const website of websitesToMonitor) {
        availableValidators.forEach(validator => {
            const callbackId = randomUUIDv7();
            console.log(`Sending validate to ${validator.validatorId} ${website.url}`);
            validator.socket.send(JSON.stringify({
                type: 'validate',
                data: {
                    url: website.url,
                    callbackId
                },
            }));

            CALLBACKS[callbackId] = async (data: IncomingMessage) => {
                if (data.type === 'validate') {
                    const { validatorId, status, latency, statusCode } = data.data;

                    await prismaClient.$transaction(async (tx:any) => {
                        await tx.websiteTick.create({
                            data: {
                                websiteId: website.id,
                                validatorId,
                                status,
                                latency,
                                createdAt: new Date(),
                                statusCode: statusCode
                            },
                        });

                        await tx.validator.update({
                            where: { id: validatorId },
                            data: {
                                pendingPayouts: { increment: COST_PER_VALIDATION },
                            },
                        });
                    });
                }
            };
        });
    }
}, 60 * 1000);