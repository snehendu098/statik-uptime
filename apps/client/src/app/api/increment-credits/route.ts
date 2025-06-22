import {prismaClient} from "db/client"

export const POST = async (req: Request) => {

    const { email } = await req.json();

    const user = await prismaClient.user.findFirst({
        where: {
            email: email
        }   
    })

    if (!user) {
        return new Response(JSON.stringify({
            message: "User doesn't exist"
        }), {status: 400 })
    }

    await prismaClient.user.update({
        where: {
            id: user.id
        },
        data: {
            credits: {
                increment: 1000
            }
        }
    })

    return new Response(JSON.stringify({
        message: "Successfully added 1000 credits to user",
        user: {
            id: user.id,
            email: user.email,
            credits: user.credits + 1000
        }
    }), {status: 200 })

}