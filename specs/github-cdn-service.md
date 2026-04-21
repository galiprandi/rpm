# GitHub CDN Service

## Overview
Cross-feature file storage service using GitHub + jsDelivr CDN for fast global delivery.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client App    │────▶│  /api/files/*    │────▶│  GitHub Repo    │
│                 │     │  (Next.js API)   │     │  (rpmsysadim    │
│  - Products     │     │                  │     │   /statics)     │
│  - Vehicles     │     │  - Sharp proc.   │     │                 │
│  - Receipts     │     │  - curl upload   │     │  ├─ files/       │
│  - Documents    │     │                  │     │  │  ├─ products/ │
└─────────────────┘     └──────────────────┘     │  │  ├─ vehicles/  │
                          │                     │  │  ├─ receipts/  │
                          ▼                     │  │  └─ documents/ │
                   ┌──────────────────┐       │  └─────────────────┘
                   │  jsDelivr CDN    │       └─────────────────────┘
                   │  (Global Cache)  │
                   └──────────────────┘
```

## Endpoints

### POST /api/files/upload
Upload file to CDN.

**Parameters:**
- `category` (required): `products`, `vehicles`, `receipts`, `documents`, `general`
- `id` (required): Unique identifier (alphanumeric, hyphen, underscore)
- `file` OR `url` (required): File to upload or URL to download from
- `process` (optional): `true` (default) or `false` - enable image compression

**Example:**
```bash
curl -X POST /api/files/upload \
  -F "category=vehicles" \
  -F "id=veh-123" \
  -F "file=@photo.jpg"
```

**Response:**
```json
{
  "success": true,
  "id": "veh-123",
  "category": "vehicles",
  "urls": {
    "cdn": "https://cdn.jsdelivr.net/gh/.../files/vehicles/veh-123.jpg",
    "github": "https://raw.githubusercontent.com/..."
  },
  "sizes": {
    "original": 2457600,
    "processed": 152400,
    "saved": 2305200,
    "compressionRatio": "93.8%"
  }
}
```

### GET /api/files/upload?category=x&id=y&ext=z
Get CDN URL without uploading.

## Categories & Processing

| Category | Max Width | Max Height | Quality | Format | Use Case |
|----------|-----------|------------|---------|--------|----------|
| `products` | 800 | 800 | 85 | PNG | Product catalog images |
| `vehicles` | 1200 | 800 | 80 | JPEG | Vehicle photos |
| `receipts` | 1200 | - | 90 | JPEG | Purchase receipts |
| `documents` | - | - | 95 | PNG | General documents |
| `general` | - | - | 85 | WebP | Everything else |

## Storage Structure

```
rpmsysadim/statics (repo)
└── files/
    ├── products/{id}.png
    ├── vehicles/{id}.jpg
    ├── receipts/{id}.jpg
    ├── documents/{id}.pdf
    └── general/{id}.webp
```

## Service API

### `uploadFile(options)`
```typescript
uploadFile({
  category: 'products',
  id: 'prod-123',
  content: Buffer,
  mimeType: 'image/png',
  message?: 'Custom commit message'
}): Promise<{
  cdnUrl: string,
  githubUrl: string,
  path: string,
  commitSha: string,
  size: number
}>
```

### `deleteFile(category, id, ext)`
```typescript
deleteFile('products', 'prod-123', 'png'): Promise<void>
```

### `getCdnUrl(category, id, ext)`
```typescript
getCdnUrl('products', 'prod-123', 'png'): string
```

## Why curl?

Next.js runtime (Turbopack/Edge) intercepts and modifies native `fetch` requests, causing 404 errors with GitHub API. Using `child_process.exec('curl...')` completely bypasses this instrumentation.

## Environment Variables

```bash
GITHUB_CDN_REPO=rpmsysadim/statics
GITHUB_CDN_BRANCH=main
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

## Migration from PRODUCT_IMAGES

The legacy `/api/products/[id]/image` endpoint will be migrated to use this service. Both systems can coexist during transition.
