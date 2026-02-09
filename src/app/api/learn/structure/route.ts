import { NextResponse } from "next/server";
import { getFullLearningTree } from "@/lib/learn-db";

// GET: Fetch full structure (Courses -> Chapters) for the creating form
export async function GET() {
    try {
        const courses = await getFullLearningTree();
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
