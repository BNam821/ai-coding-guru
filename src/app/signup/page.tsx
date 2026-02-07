import { SignupForm } from "@/components/auth/signup-form";
import { PageBackground } from "@/components/ui/page-background";

export default function SignupPage() {
    return (
        <main className="min-h-screen pt-32 px-4 relative z-10">
            <div className="container mx-auto max-w-4xl">
                <SignupForm />
            </div>
        </main>
    );
}
