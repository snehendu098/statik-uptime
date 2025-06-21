import { prismaClient } from "db/client";

export async function GET(req: Request) {
    
    const userId = req.headers.get("user-id");

    console.log("userId", userId)

    if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), { status: 401 });
    }

    const data = await prismaClient.website.findMany({
        where: {
            userId,
            disabled: false
        },
        include: {
            ticks: true 
        }
    });

    console.log(data)

    if (!data) {
        return new Response(JSON.stringify({ error: "Website not found or disabled" }), { status: 404 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
}
