# Header-based routing

$productName$ can route to target services based on HTTP headers with the `headers` and `regex_headers` specifications. Multiple mappings with different annotations can be applied to construct more complex routing rules.

## The `headers` annotation

The `headers` attribute is a dictionary of `header`: `value` pairs. $productName$ will only allow requests that match the specified `header`: `value` pairs to reach the target service.

You can also set the `value` of a header to `true` to test for the existence of a header.

### Example

```yaml
---
apiVersion: getambassador.io/v3alpha1
kind:  Mapping
metadata:
  name:  quote-backend
spec:
  prefix: /backend/
  service: quote
  headers:
    x-quote-mode: backend
    x-random-header: datawire
```

will allow requests to /backend/ to succeed only if the x-quote-mode header has the value backend and the x-random-header has the value `datawire`.

### Conditional example

```yaml
---
apiVersion: getambassador.io/v3alpha1
kind:  Mapping
metadata:
  name:  quote-mode
spec:
  prefix: /backend/
  service: quote-mode
  headers:
    x-quote-mode: true

---
apiVersion: getambassador.io/v3alpha1
kind:  Mapping
metadata:
  name:  quote-regular
spec:
  prefix: /backend/
  service: quote-regular
```

will send requests that contain the x-quote-mode header to the quote-mode target, while routing all other requests to the quote-regular target.

## Regex headers

The following mapping will route mobile requests from Android and iPhones to a mobile service:

```yaml
---
apiVersion: getambassador.io/v3alpha1
kind:  Mapping
metadata:
  name:  quote-backend
spec:
  regex_headers:
    user-agent: ".*(iPhone|(a|A)ndroid).*"
  prefix: /backend/
  service: quote
```
