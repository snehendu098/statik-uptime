import { prismaClient } from "db/client";
export default async function GET(req: Request) {
    const url = new URL(req.url);
    const userId = req.headers.get("user-id");
    if (!userId) {
        return new Response(JSON.stringify({ error: "User ID is required" }), { status: 401 });
    }

    const data = await prismaClient.website.findFirst({
        where: {
            userId,
            disabled: false
        },
        include: {
            ticks: true 
        }
    });

    if (!data) {
        return new Response(JSON.stringify({ error: "Website not found or disabled" }), { status: 404 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
}
