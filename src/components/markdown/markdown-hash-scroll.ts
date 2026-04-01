const SANITIZED_ID_PREFIX = "user-content-";

function getCandidateIds(hash: string): string[] {
    const decodedHash = decodeURIComponent(hash.startsWith("#") ? hash.slice(1) : hash);

    if (!decodedHash) {
        return [];
    }

    if (decodedHash.startsWith(SANITIZED_ID_PREFIX)) {
        return [decodedHash];
    }

    return [decodedHash, `${SANITIZED_ID_PREFIX}${decodedHash}`];
}

export function getHashTarget(hash: string): HTMLElement | null {
    const candidateIds = getCandidateIds(hash);

    for (const candidateId of candidateIds) {
        const element = document.getElementById(candidateId);

        if (element) {
            return element;
        }
    }

    return null;
}

export function scrollToHashTarget(hash: string, behavior: ScrollBehavior): boolean {
    const target = getHashTarget(hash);

    if (!target) {
        return false;
    }

    target.scrollIntoView({
        behavior,
        block: "start",
    });

    return true;
}

export function scheduleHashScroll(
    hash: string,
    behavior: ScrollBehavior,
    maxAttempts = 10
): void {
    let attempts = 0;

    const tryScroll = () => {
        attempts += 1;

        if (scrollToHashTarget(hash, behavior) || attempts >= maxAttempts) {
            return;
        }

        window.requestAnimationFrame(tryScroll);
    };

    window.requestAnimationFrame(tryScroll);
}
