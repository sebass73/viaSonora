# Contract: Map Discovery APIs

## 1) Public Posts Feed for Pins

### Endpoint
- `GET /api/posts`

### Purpose
- Proveer publicaciones publicas para renderizar pins del mapa.

### Query Parameters (relevantes para esta feature)
- `page` (opcional)
- `pageSize` (opcional)
- `search` (opcional)
- `categoryId` (opcional)

### Response Contract (subset)
```json
{
  "data": [
    {
      "id": "post_id",
      "city": "Buenos Aires",
      "areaText": "Palermo",
      "instrument": {
        "id": "instrument_id",
        "title": "Guitarra criolla",
        "photos": [{ "url": "https://..." }],
        "locations": [{ "lat": -34.60, "lng": -58.38 }]
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pageSize": 12,
    "totalPages": 1
  }
}
```

### Behavioral Guarantees
- Solo incluye `Post` aprobados y no expirados.
- Coordenadas son publicas aproximadas (no exactas).
- Cada post se representa con una unica ubicacion primaria para pin.

## 2) Geo Fallback for Initial Center

### Endpoint
- `GET /api/geo`

### Purpose
- Proveer coordenadas de respaldo para centrado inicial si falla geolocalizacion del navegador.

### Response Contract
```json
{
  "lat": -34.6037,
  "lng": -58.3816,
  "city": "Buenos Aires",
  "country": "AR"
}
```

### Behavioral Guarantees
- Si hay datos geograficos por headers/IP, retorna coordenadas validas.
- Si no hay datos disponibles, retorna fallback Buenos Aires.

## Non-goals Covered by Contract
- Sin clustering de pins.
- Sin filtrado por viewport del mapa.
- Sin radio de distancia respecto al usuario.
- Sin popup blanco de Leaflet al seleccionar pin (la UI usa solo card superpuesta).
