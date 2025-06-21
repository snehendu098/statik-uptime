import {prismaClient} from "db/client"

export default async function POST(req: Request) {
    const {url, email} = await req.json();
    if (!url) {
        return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
    }

    if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }
    // Check if the user exists
    const user = await prismaClient.user.findFirst({
        where: {
            email: email
        }
    });
    // If user does not exist, create a new user
    if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

await prismaClient.website.create({
    data: {
        url: url,
        user: {
            // Replace 'userId' with the actual user ID or logic to get the user
            connect: { id: user?.id }
        }
    }
});    
}