import {prismaClient} from "."

export async function createUser(email:string) {
    await prismaClient.user.create({
        data: {
            email,
            role: 0
        }
    })
}

export async function createValidatorUser(email:string, wallet: string ) {
 await prismaClient.user.create({
    data: {
        email,
        role: 1,
        walletAddress: wallet
    }
 })
}