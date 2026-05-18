# Org policy: require OS Login on all VMs
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-require-oslogin-003" {
  name   = "organizations/${var.org_id}/policies/compute.requireOsLogin"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }

  depends_on = [google_project_service.gcp-apse1-apis-hub-net-003]
}

# Org policy: skip default VPC creation in new projects
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-skip-default-network-003" {
  name   = "organizations/${var.org_id}/policies/compute.skipDefaultNetworkCreation"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }

  depends_on = [google_project_service.gcp-apse1-apis-hub-net-003]
}

# Org policy: deny external IP on all VMs across the organization
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-deny-vm-external-ip-003" {
  name   = "organizations/${var.org_id}/policies/compute.vmExternalIpAccess"
  parent = "organizations/${var.org_id}"

  spec {
    inherit_from_parent = false
    rules {
      deny_all = "TRUE"
    }
  }

  depends_on = [google_project_service.gcp-apse1-apis-hub-net-003]
}

# Project-level exception: allow external IP for the Bastion Host in shared-access project
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-allow-vm-external-ip-bastion-003" {
  name   = "projects/${data.google_project.gcp-apse1-prj-sh-access-003.project_id}/policies/compute.vmExternalIpAccess"
  parent = "projects/${data.google_project.gcp-apse1-prj-sh-access-003.project_id}"

  spec {
    inherit_from_parent = false # override org-level deny_all
    rules {
      values {
        allowed_values = [
          "projects/${data.google_project.gcp-apse1-prj-sh-access-003.project_id}/zones/asia-southeast1-b/instances/gcp-asia-southeast1-vm-bastion-003",
        ]
      }
    }
  }

  # Make sure the org-level deny is applied first so the project exception clearly overrides it
  # and wait for the hub API enablement to finish as well
  depends_on = [
    google_org_policy_policy.gcp-asia-southeast1-org-policy-deny-vm-external-ip-003,
    google_project_service.gcp-apse1-apis-hub-net-003,
  ]
}

# Dynamic Import Blocks (Terraform 1.5+) to resolve 409 'Requested entity already exists'
import {
  to = google_org_policy_policy.gcp-asia-southeast1-org-policy-require-oslogin-003
  id = "organizations/54431047904/policies/compute.requireOsLogin"
}

import {
  to = google_org_policy_policy.gcp-asia-southeast1-org-policy-skip-default-network-003
  id = "organizations/54431047904/policies/compute.skipDefaultNetworkCreation"
}

import {
  to = google_org_policy_policy.gcp-asia-southeast1-org-policy-deny-vm-external-ip-003
  id = "organizations/54431047904/policies/compute.vmExternalIpAccess"
}


