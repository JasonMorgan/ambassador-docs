# Rate limit service

Rate limiting is a powerful technique to improve the [availability and
resilience of your
services](https://blog.getambassador.io/rate-limiting-a-useful-tool-with-distributed-systems-6be2b1a4f5f4).
In $productName$, each request can have one or more *labels*.  These labels are
exposed to a third-party service via a gRPC API.  The third-party service can
then rate limit requests based on the request labels.

**Note that `RateLimitService` is only applicable to $OSSproductName$,
and not $AESproductName$, as $AESproductName$ includes a
built-in rate limit service.**

## Request labels

See [Attaching labels to
requests](../../../using/rate-limits#attaching-labels-to-requests)
for how to configure the labels that are attached to a request.

## Domains

In $productName$, each engineer (or team) can be assigned its own *domain*.  A
domain is a separate namespace for labels.  By creating individual domains, each
team can assign their own labels to a given request, and independently set the
rate limits based on their own labels.

See [Attaching labels to
requests](../../../using/rate-limits/#attaching-labels-to-requests)
for how to labels under different domains.

## External rate limit service

In order for $productName$ to rate limit, you need to implement a
gRPC `RateLimitService`, as defined in [Envoy's `v2/rls.proto`]
interface.  If you do not have the time or resources to implement your own rate
limit service, $AESproductName$ integrates a high-performance rate
limiting service.

[Envoy's `v2/rls.proto`]: https://github.com/emissary-ingress/emissary/tree/$branch$/api/envoy/service/ratelimit/v2/rls.proto

$productName$ generates a gRPC request to the external rate limit
service and provides a list of labels on which the rate limit service can base
its decision to accept or reject the request:

```
[
  {"source_cluster", "<local service cluster>"},
  {"destination_cluster", "<routed target cluster>"},
  {"remote_address", "<trusted address from x-forwarded-for>"},
  {"generic_key", "<descriptor_value>"},
  {"<some_request_header>", "<header_value_queried_from_header>"}
]
```

If $productName$ cannot contact the rate limit service, it will
allow the request to be processed as if there were no rate limit service
configuration.

It is the external rate limit service's responsibility to determine whether rate
limiting should take place, depending on custom business logic.  The rate limit
service must simply respond to the request with an `OK` or `OVER_LIMIT` code:

* If Envoy receives an `OK` response from the rate limit service, then $productName$ allows the client request to resume being processed by
  the normal flow.
* If Envoy receives an `OVER_LIMIT` response, then $productName$
  will return an HTTP 429 response to the client and will end the transaction
  flow, preventing the request from reaching the backing service.

The headers injected by the [AuthService](../auth-service) can also be passed to
the rate limit service since the `AuthService` is invoked before the
`RateLimitService`.

## Configuring the rate limit service

A `RateLimitService` manifest configures $productName$ to use an
external service to check and enforce rate limits for incoming requests:

```yaml
---
apiVersion: getambassador.io/v3alpha1
kind:  RateLimitService
metadata:
  name:  ratelimit
spec:
  service: "example-rate-limit.default:5000"
  protocol_version: oneOf[v2, v3]    # optional; default is v2
```

- `service` gives the URL of the rate limit service. If using a Kubernetes service, this should be the [namespace-qualified DNS name](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#namespaces-of-services) of that service.
- `protocol_version` (optional) gRPC service name used to communicate with the `RateLimitService`. Allowed values are `v2` which will use the `envoy.service.ratelimit.v2.RateLimitService`, and `v3` which will use the `envoy.service.ratelimit.v3.RateLimitService` service name. Note that `v3` requires $productName$ to run in Envoy v3 mode by setting the AMBASSADOR_ENVOY_API_VERSION=V3 environment variable.


You may only use a single `RateLimitService` manifest.

## Rate limit service and TLS

You can tell $productName$ to use TLS to talk to your service by
using a `RateLimitService` with an `https://` prefix.  However, you may also
provide a `tls` attribute: if `tls` is present and `true`, $productName$ will originate TLS even if the `service` does not have the `https://`
prefix.

If `tls` is present with a value that is not `true`, the value is assumed to be the name of a defined TLS context, which will determine the certificate presented to the upstream service.

## Example

The [$OSSproductName$ Rate Limiting
Tutorial](../../../../howtos/rate-limiting-tutorial) has a simple rate limiting
example.  For a more advanced example, read the [advanced rate limiting
tutorial](../../../../howtos/advanced-rate-limiting), which uses the rate limit
service that is integrated with $AESproductName$.

## Further reading

* [Rate limiting: a useful tool with distributed systems](https://blog.getambassador.io/rate-limiting-a-useful-tool-with-distributed-systems-6be2b1a4f5f4)
* [Rate limiting for API Gateways](https://blog.getambassador.io/rate-limiting-for-api-gateways-892310a2da02)
* [Implementing a Java Rate Limiting Service for $productName$](https://blog.getambassador.io/implementing-a-java-rate-limiting-service-for-the-ambassador-api-gateway-e09d542455da)
* [Designing a Rate Limit Service for $productName$](https://blog.getambassador.io/designing-a-rate-limiting-service-for-ambassador-f460e9fabedb)
