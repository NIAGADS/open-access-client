import { NextRequest } from "next/server";
import { fetchApiResponse } from "../route-handler";

const _extract_mcp_headers = (request: NextRequest) => {
    const headers = new Headers();

    for (const name of ["Accept", "Content-Type", "Mcp-Session-Id", "MCP-Protocol-Version", "Last-Event-ID"]) {
        const value = request.headers.get(name);
        if (value !== null) headers.set(name, value);
    }

    return headers;
};

export async function GET(request: NextRequest) {
    return await fetchApiResponse(request, null, _extract_mcp_headers(request));
}

export async function POST(request: NextRequest) {
    return await fetchApiResponse(request, null, _extract_mcp_headers(request));
}

export async function DELETE(request: NextRequest) {
    return await fetchApiResponse(request, null, _extract_mcp_headers(request));
}
