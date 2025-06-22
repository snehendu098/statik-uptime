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

    return new Response(JSON.stringify({
        message: "Fetched user credits",
        user: {
            id: user.id,
            email: user.email,
            credits: user.credits
        }
    }), {status: 200 })

}