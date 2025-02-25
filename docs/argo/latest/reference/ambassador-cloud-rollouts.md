import Alert from '@material-ui/lab/Alert';

# Ambassador Cloud Rollouts

Ambassador Cloud allows you to progressively rollout new versions of your services listed in the Service Catalog.

This feature leverages [Argo CD](../../concepts/argo/) to automatically monitor changes to a Git repository
and apply them to your Kubernetes cluster, following a [GitOps](../../concepts/gitops/) approach. At this
point, [Argo Rollouts](../../concepts/argo/) comes in to control how traffic coming from Edge Stack gets
sent to the new version of your service.

## Flow

Upon creation of a rollout, Ambassador Cloud will prompt for a few questions:
- **Image tag**: new docker image version to rollout.
- **Rollout duration**: amount of time on which to spread the rollout steps between 0% and 100% traffic sent to the canary version.
- **Weight increment**: increment to the percentage of traffic routed to the canary version, distributed over the rollout duration.
- **Number of pods**: number of replicas (pods) your application should be running at the end of the rollout duration.

Once this information has been provided, Ambassador Cloud will look for Kubernetes manifests at the [path](#a8riorolloutsscmpath) of
the [repository](#a8riorepository) and update them as follows:

If no `Rollout` object is found matching the [deployment manifest name](#a8riorolloutsdeployment) (which should only
happen the first time a rollout is created), then Ambassador Cloud will look for a `Deployment` object matching that same name.
If found, a new `Rollout` manifest will be created referring to that deployment object and configured with the
[mappings](#a8riorolloutsmappings). A new [canary](/docs/argo/latest/concepts/canary/) service based on the current service specs
will also be created to allow Argo Rollouts to control the flow between the two versions.

The rollout steps will then be resolved based on the provided rollout duration and weight increment along with the
new number of pods. Ambassador Cloud will also search for a container (either in the `Rollout` or `Deployment` manifest) that
has an `image` property matching the configured [image name](#a8riorolloutsimage-reponame) and update it with the
provided new image tag.

Ambassador Cloud will then update those manifests on a new branch, open a pull request targeting the
[base branch](#a8riorolloutsscmbranch) and show you that new rollout in the service rollouts page. You'll see a
"Merge pull request" button that will take you to the pull request where you can approve and merge it.

Once the pull request is merged, Argo CD will detect that a new version of the `Application` has been pushed on the
repository and will sync the new manifests in the Kubernetes cluster. Once applied, Argo Rollouts will proceed to the
progressive delivery of the `Rollout` object and its progress will be reported in Ambassador Cloud.

## Configuration

The following annotations are leveraged to make the Rollouts flow possible.

### Source Control Management

#### `a8r.io/repository`

The repository on which to bring changes.

#### `a8r.io/rollouts.scm.path`

The path in which the Kubernetes manifests should be found.

#### `a8r.io/rollouts.scm.branch`

The branch to target when pull requests are opened by Ambassador Cloud to rollout a new version.

### Container Image Repository

#### `a8r.io/rollouts.image-repo.type`

The image repository type. Accepted values are `dockerhub` or `gitlab`.

#### `a8r.io/rollouts.image-repo.name`

The name of the image repository. This is used by Ambassador Cloud to identify which container to update in the Kubernetes manifests to update with the new image version. Per example, if the container to update's specs contain: `image: datawire/demo-image:1.2.3`, the value for the annotation should be `datawire/demo-image`.

<Alert severity="warning">
  If <strong>a8r.io/rollouts.image-repo.type</strong> is set to <strong>gitlab</strong>, <strong>a8r.io/rollouts.image-repo.name</strong> must be the <strong>Repository ID</strong> of the GitLab Container Registry you are trying to use.<br/>
  For example, given the URL <strong>https://gitlab.com/datawire/rollouts</strong>, the <strong>Repository ID</strong> will be <strong>datawire/rollouts</strong>.
</Alert>

### Manifests

#### `a8r.io/rollouts.deployment`

Name of the Kubernetes `Deployment` or `Rollout` object to update for rollouts.

#### `a8r.io/rollouts.mappings`

Coma separated list of Mapping objects that should control rollout traffic.
