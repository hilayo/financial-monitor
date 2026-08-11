# ADR-001: Distributed SignalR Synchronization

## Status

Accepted

## Context

The Financial Monitor backend can be deployed to multiple pods/replicas. Each pod maintains its own in-process SignalR connections and SQLite database file. Without coordination:

- A client connected to Pod A will not receive broadcasts triggered by HTTP ingestion on Pod B.
- SQLite files are local to each pod, so transaction history diverges across replicas.

## Decision

Use the **SignalR Redis backplane** (`Microsoft.AspNetCore.SignalR.StackExchangeRedis`) to synchronize real-time message delivery across all API instances.

### How it works

1. Pod B receives `POST /api/transactions`.
2. Pod B persists the transaction locally and calls `IHubContext.Clients.All.SendAsync(...)`.
3. The Redis backplane publishes the message to a Redis channel.
4. All pods subscribed to the channel deliver the event to their connected WebSocket clients.

This solves the **real-time fan-out problem** across replicas without requiring sticky sessions for broadcasts.

## Consequences

### Benefits

- Horizontally scalable WebSocket delivery
- No sticky-session requirement for broadcast synchronization
- Standard ASP.NET Core integration with minimal code changes

### Trade-offs

- Redis becomes a runtime dependency for multi-pod deployments
- Adds operational complexity (Redis availability, monitoring, persistence policy)
- SQLite remains per-pod; GET snapshots may differ between replicas unless storage is externalized

## Storage Strategy for Production

For MVP/demo we use SQLite per instance. For production multi-replica persistence:

1. Replace `ITransactionRepository` with a PostgreSQL implementation
2. Keep Redis backplane for SignalR
3. Optionally add read replicas or caching for dashboard snapshots

Alternative managed option: **Azure SignalR Service** removes the need to operate Redis directly while providing global scale-out.

## Failure Modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Redis unavailable | Cross-pod broadcasts stop; local pod broadcasts still work | Health checks, Redis HA (Sentinel/Cluster), circuit breaker alerts |
| Single pod restart | Clients reconnect via automatic reconnect | K8s readiness/liveness probes |
| SQLite per pod | Inconsistent historical snapshots | Move to shared PostgreSQL |

## Local Validation

`docker-compose.yml` runs two API containers (`api`, `api-replica`) with a shared Redis backplane. POST to port 8080 and observe live updates on a dashboard connected through port 8081.
