import { type NextRequest } from "next/server";
import { createHmac } from "node:crypto";

const _build_headers = (request: NextRequest, headers: HeadersInit | undefined) => {
    const upstreamHeaders = new Headers(headers);
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (!forwardedFor) throw new Error("X-Forwarded-For is missing.");

    const secret: string = process.env.API_SIGNING_SECRET!;
    const clientIP = forwardedFor.split(",", 1)[0].trim();
    upstreamHeaders.set("X-Client-IP", clientIP);
    upstreamHeaders.set("X-Client-IP-Signature", createHmac("sha256", secret).update(forwardedFor).digest("hex"));
    return upstreamHeaders;
};

export async function fetchApiResponse(
    request: NextRequest,
    timeoutMs: number | null = 100000,
    headers?: HeadersInit
): Promise<Response> {
    const timeout = timeoutMs === null ? undefined : AbortSignal.timeout(timeoutMs);
    const abortSignal = timeout ? AbortSignal.any([request.signal, timeout]) : request.signal;

    const upstreamHeaders = _build_headers(request, headers);

    try {
        const base = new URL(process.env.API_INTERNAL_URL!);
        const path = request.nextUrl.pathname.replace("/api", "");
        const target = new URL(path, base);
        target.search = request.nextUrl.search;

        return await fetch(target, {
            method: request.method,
            headers: upstreamHeaders,
            body: request.method === "POST" ? await request.text() : undefined,
            cache: "no-store",
            signal: abortSignal,
        });
    } catch (error) {
        if (request.signal.aborted) return new Response(null, { status: 499 });
        return Response.json(
            {
                detail: "Unable to access the NIAGADS Open Access API.",
                message:
                    "Please reload or try the your request again.  If the problem persists, please let us know at help@niagads.org with the subject NIAGADS API Systems Error and we will try and resolve the issue as soon as possible.",
            },
            { status: timeout?.aborted ? 504 : 502 }
        );
    }
}
