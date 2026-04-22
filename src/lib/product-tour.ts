export const PRODUCT_TOUR_STEP_PARAM = "tourStep";
export const PRODUCT_TOUR_RECOMMENDED_COURSE_PARAM = "recommendedCourse";

export const PRODUCT_TOUR_STEPS = [
    {
        id: "welcome-choice",
        order: 1,
        route: "/",
        kind: "choice",
        badge: "B\u01b0\u1edbc 1",
        title: "Ch\u00e0o m\u1eebng \u0111\u1ebfn v\u1edbi AI Coding Guru!",
        description: "Tr\u01b0\u1edbc khi b\u1eaft \u0111\u1ea7u, h\u00e3y cho ch\u00fang t\u00f4i bi\u1ebft, b\u1ea1n l\u00e0:",
        choices: [
            {
                id: "beginner",
                label: "Ng\u01b0\u1eddi m\u1edbi b\u1eaft \u0111\u1ea7u",
                description: "T\u1ea1o t\u00e0i kho\u1ea3n m\u1edbi \u0111\u1ec3 b\u1eaft \u0111\u1ea7u h\u00e0nh tr\u00ecnh h\u1ecdc l\u1eadp tr\u00ecnh c\u00f9ng AI.",
                href: "/signup",
                nextStepId: "signup-guide",
                accent: "secondary",
                icon: "rocket",
            },
            {
                id: "returning",
                label: "\u0110\u00e3 t\u1eebng s\u1eed d\u1ee5ng tr\u01b0\u1edbc \u0111\u00e2y",
                description: "\u0110\u0103ng nh\u1eadp \u0111\u1ec3 ti\u1ebfp t\u1ee5c ti\u1ebfn tr\u00ecnh h\u1ecdc v\u00e0 truy c\u1eadp d\u1eef li\u1ec7u c\u1ee7a b\u1ea1n.",
                href: "/login",
                accent: "primary",
                icon: "brain",
            },
        ],
        closeLabel: "\u0110\u1ec3 sau",
    },
    {
        id: "signup-guide",
        order: 2,
        route: "/signup",
        kind: "guided-form",
        badge: "B\u01b0\u1edbc 2",
        title: "H\u01b0\u1edbng d\u1eabn t\u1ea1o t\u00e0i kho\u1ea3n",
        description: "L\u00e0m theo t\u1eebng b\u01b0\u1edbc b\u00ean d\u01b0\u1edbi \u0111\u1ec3 ho\u00e0n t\u1ea5t \u0111\u0103ng k\u00fd.",
        fields: [
            {
                id: "username",
                label: "T\u00ean \u0111\u0103ng nh\u1eadp",
                instruction: "\u0110i\u1ec1n t\u00ean \u0111\u0103ng nh\u1eadp c\u1ee7a b\u1ea1n.",
                advanceLabel: "Ti\u1ebfp t\u1ee5c",
            },
            {
                id: "email",
                label: "Email",
                instruction: "\u0110i\u1ec1n email c\u1ee7a b\u1ea1n.",
                advanceLabel: "Ti\u1ebfp t\u1ee5c",
            },
            {
                id: "password",
                label: "M\u1eadt kh\u1ea9u",
                instruction: "Nh\u1eadp m\u1eadt kh\u1ea9u c\u1ee7a b\u1ea1n.",
                advanceLabel: "Ti\u1ebfp t\u1ee5c",
            },
            {
                id: "confirmPassword",
                label: "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u",
                instruction: "X\u00e1c nh\u1eadn l\u1ea1i m\u1eadt kh\u1ea9u \u0111\u1ec3 \u0111\u1ea3m b\u1ea3o b\u1ea1n nh\u1eadp \u0111\u00fang.",
                advanceLabel: "Ti\u1ebfp t\u1ee5c",
            },
            {
                id: "submit",
                label: "N\u00fat \u0111\u0103ng k\u00fd",
                instruction: "Nh\u1ea5n \"\u0110\u0103ng k\u00fd ngay\" \u0111\u1ec3 chuy\u1ec3n sang b\u01b0\u1edbc 3.",
                advanceLabel: null,
            },
        ],
        nextStepId: "signup-step-3",
    },
    {
        id: "signup-step-3",
        order: 3,
        route: "/signup",
        kind: "choice",
        badge: "B\u01b0\u1edbc 3",
        title: "H\u00e3y cho AI Coding Guru bi\u1ebft:",
        description: "Ch\u1ecdn nh\u00f3m ph\u00f9 h\u1ee3p \u0111\u1ec3 ch\u00fang t\u00f4i g\u1ee3i \u00fd kh\u00f3a h\u1ecdc C++ ph\u00f9 h\u1ee3p cho b\u1ea1n.",
        choices: [
            {
                id: "learning-from-scratch",
                label: "B\u1ea1n l\u00e0 ng\u01b0\u1eddi b\u1eaft \u0111\u1ea7u h\u1ecdc l\u1eadp tr\u00ecnh",
                description: "\u0110\u0103ng k\u00ed kh\u00f3a C++ c\u01a1 b\u1ea3n",
                href: "/learn",
                accent: "secondary",
                icon: "rocket",
                recommendedCourse: "cpp-basic",
            },
            {
                id: "already-know-programming",
                label: "B\u1ea1n l\u00e0 ng\u01b0\u1eddi \u0111\u00e3 c\u00f3 ki\u1ebfn th\u1ee9c v\u1ec1 l\u1eadp tr\u00ecnh",
                description: "\u0110\u0103ng k\u00ed kh\u00f3a C++ n\u00e2ng cao",
                href: "/learn",
                accent: "primary",
                icon: "brain",
                recommendedCourse: "cpp-advanced",
            },
        ],
        closeLabel: "\u0110\u1ec3 sau",
    },
    {
        id: "learn-first-lesson",
        order: 4,
        route: "/learn/[course]",
        kind: "guided-content",
        badge: "B\u01b0\u1edbc 4",
        title: "B\u1eaft \u0111\u1ea7u t\u1eeb b\u00e0i 1, ch\u01b0\u01a1ng 1",
        description: "H\u00e3y m\u1edf b\u00e0i \u0111\u1ea7u ti\u00ean \u1edf ch\u01b0\u01a1ng 1 \u0111\u1ec3 AI Coding Guru d\u1eabn b\u1ea1n theo l\u1ed9 tr\u00ecnh ph\u00f9 h\u1ee3p.",
    },
    {
        id: "lesson-ai-guide",
        order: 5,
        route: "/learn/[course]/[lesson]",
        kind: "guided-content",
        badge: "B\u01b0\u1edbc 5",
        title: "L\u0103n chu\u1ed9t \u0111\u1ec3 \u0111\u1ecdc t\u00e0i li\u1ec7u",
        description: "L\u0103n chu\u1ed9t \u0111\u1ec3 \u0111\u1ecdc t\u00e0i li\u1ec7u. Khi g\u1eb7p ph\u1ea7n \"C\u00e2u h\u1ecfi t\u1eeb AI\", h\u00e3y l\u00e0m c\u00e1c c\u00e2u h\u1ecfi t\u1eeb AI \u0111\u1ec3 hi\u1ec3u h\u01a1n v\u1ec1 n\u1ed9i dung b\u1ea1n v\u1eeba h\u1ecdc.",
    },
] as const;

export type ProductTourStep = (typeof PRODUCT_TOUR_STEPS)[number];
export type ProductTourStepId = ProductTourStep["id"];

export function isProductTourStepId(value: string | null | undefined): value is ProductTourStepId {
    return PRODUCT_TOUR_STEPS.some((step) => step.id === value);
}

export function getProductTourStep(stepId: string | null | undefined) {
    if (!isProductTourStepId(stepId)) {
        return null;
    }

    return PRODUCT_TOUR_STEPS.find((step) => step.id === stepId) ?? null;
}

export function buildProductTourHref(pathname: string, stepId: ProductTourStepId) {
    return `${pathname}?${PRODUCT_TOUR_STEP_PARAM}=${stepId}`;
}

export function buildTourUrl(
    pathname: string,
    params: Partial<Record<typeof PRODUCT_TOUR_STEP_PARAM | typeof PRODUCT_TOUR_RECOMMENDED_COURSE_PARAM, string>>
) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            searchParams.set(key, value);
        }
    });

    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
}
