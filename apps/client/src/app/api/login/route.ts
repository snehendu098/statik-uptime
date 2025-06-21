import {prismaClient} from "db/client"

export const POST = async (req: Request) => {

    const { email } = await req.json();

    const user = await prismaClient.user.findFirst({
        where: {
            email: email
        }   
    })

    if (!user) {
        await prismaClient.user.create({
            data: {
                email: email
            }
        })
        return new Response(JSON.stringify({
            message: "User created successfully"
        }))
    }

    return new Response(JSON.stringify({
        message: "User already exists"
    }))

}