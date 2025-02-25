import Alert from '@material-ui/lab/Alert';

# Distributed tracing with Zipkin

In this tutorial, we'll configure $productName$ to initiate a trace on some sample requests, and use Zipkin to visualize them.

## Before you get started

This tutorial assumes you have already followed $productName$ [Getting Started](../../tutorials/getting-started) guide. If you haven't done that already, you should do that now.

After completing the Getting Started guide you will have a Kubernetes cluster running $productName$ and the Quote of the Moment service. Let's walk through adding tracing to this setup.

## 1. Deploy Zipkin

In this tutorial, you will use a simple deployment of the open-source [Zipkin](https://github.com/openzipkin/zipkin/wiki) distributed tracing system to store and visualize $productName$-generated traces. The trace data will be stored in memory within the Zipkin container, and you will be able to explore the traces via the Zipkin web UI.

First, add the following YAML to a file named `zipkin.yaml`. This configuration will create a Zipkin Deployment that uses the [openzipkin/zipkin](https://hub.docker.com/r/openzipkin/zipkin/) container image and also an associated Service. We will also include a `TracingService` that configures $productName$ to use the Zipkin service (running on the default port of 9411) to provide tracing support.

```yaml
---
apiVersion: getambassador.io/v3alpha1
kind: TracingService
metadata:
  name: tracing
spec:
  service: "zipkin:9411"
  driver: zipkin
  config: {}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zipkin
spec:
  replicas: 1
  selector:
    matchLabels:
      app: zipkin
  template:
    metadata:
      labels:
        app: zipkin
    spec:
      containers:
        - name: zipkin
          image: openzipkin/zipkin
          env:
            # note: in-memory storage holds all data in memory, purging older data upon a span limit.
            #       you should use a proper storage in production environments
            - name: STORAGE_TYPE
              value: mem
---
apiVersion: v1
kind: Service
metadata:
  labels:
    name: zipkin
  name: zipkin
spec:
  ports:
    - port: 9411
      targetPort: 9411
  selector:
    app: zipkin
```

Next, deploy this configuration into your cluster:

```
$ kubectl apply -f zipkin.yaml
```

<Alert severity="info">
  $productName$ will need to be restarted to configure itself to add the tracing header. This command will restart all the Pods (assuming $productName$ is installed in the <code>ambassador</code> namespace):
  <br/>
  <code>kubectl -n ambassador rollout restart deploy</code>
</Alert>

## 2. Generate some requests

Use `curl` to generate a few requests to an existing $productName$ `Mapping`. You may need to perform many requests since only a subset of random requests are sampled and instrumented with traces.

```
$ curl -L $AMBASSADOR_IP/backend/
```

## 3. Test traces

To test things out, we'll need to access the Zipkin UI. If you're on Kubernetes, get the name of the Zipkin pod:

```
$ kubectl get pods
NAME                                   READY     STATUS    RESTARTS   AGE
ambassador-5ffcfc798-c25dc             2/2       Running   0          1d
prometheus-prometheus-0                2/2       Running   0          113d
zipkin-868b97667c-58v4r                1/1       Running   0          2h
```

And then use `kubectl port-forward` to access the pod:

```
$ kubectl port-forward zipkin-868b97667c-58v4r 9411
```

Open your web browser to `http://localhost:9411` for the Zipkin UI.

If you're on `minikube` you can access the `NodePort` directly, and this ports number can be obtained via the `minikube services list` command. If you are using `Docker for Mac/Windows`, you can use the `kubectl get svc` command to get the same information.

```
$ minikube service list
|-------------|----------------------|-----------------------------|
|  NAMESPACE  |         NAME         |             URL             |
|-------------|----------------------|-----------------------------|
| default     | ambassador-admin     | http://192.168.99.107:30319 |
| default     | ambassador           | http://192.168.99.107:31893 |
| default     | zipkin               | http://192.168.99.107:31043 |
|-------------|----------------------|-----------------------------|
```

Open your web browser to the Zipkin dashboard `http://192.168.99.107:31043/zipkin/`.

In the Zipkin UI, click on the "Find Traces" button to get a listing instrumented traces. Each of the traces that are displayed can be clicked on, which provides further information about each span and associated metadata.

## Learn more

For more details about configuring the external tracing service, read the documentation on [external tracing](../../topics/running/services/tracing-service).
