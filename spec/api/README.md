# API Reference

This directory documents the backend REST API contract as consumed by the frontend.

## Base URL

All endpoints are under: `{NEXT_PUBLIC_API_BASE_URL}/api/v1/`

## Authentication

All requests (except login, setup, and join) require a valid `login_code` httpOnly cookie. The frontend includes `credentials: 'include'` on every fetch call.

## Documents

- **[contract.md](contract.md)** — Complete endpoint reference: method, path, auth, request/response shapes
- **[response-shapes.md](response-shapes.md)** — Shared types: enums, constants, common response patterns, TypeScript interfaces

## Source of Truth

The canonical API reference is [FRONTEND_SEED.md](../../FRONTEND_SEED.md) Sections 4–6. These documents are transcriptions organized for developer lookup. When the backend changes, update these docs and date-stamp the "Last verified" header.
