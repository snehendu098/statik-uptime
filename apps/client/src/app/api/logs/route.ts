import {prismaClient} from "db/client"

export const POST = async (req: Request) => {

    const { email, websiteId } = await req.json();

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

    const creds = await prismaClient.website.findFirst({
        where: {
            userId: user.id,
            id: websiteId
        },
        include: {
            ticks: true
        }
    })

    return new Response(JSON.stringify({
        message: "Successfully fetched website data",
        creds
    }), {status: 200 })

}