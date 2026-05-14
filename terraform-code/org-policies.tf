# Org policy: require OS Login on all VMs
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-require-oslogin-001" {
  name   = "organizations/${var.org_id}/policies/compute.requireOsLogin"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

# Org policy: skip default VPC creation in new projects
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-skip-default-network-001" {
  name   = "organizations/${var.org_id}/policies/compute.skipDefaultNetworkCreation"
  parent = "organizations/${var.org_id}"

  spec {
    rules {
      enforce = "TRUE"
    }
  }
}

# Org policy: deny external IP on all VMs across the organization
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-deny-vm-external-ip-001" {
  name   = "organizations/${var.org_id}/policies/compute.vmExternalIpAccess"
  parent = "organizations/${var.org_id}"

  spec {
    inherit_from_parent = false
    rules {
      deny_all = "TRUE"
    }
  }
}

# Project-level exception: allow external IP for the Bastion Host in shared-access project
resource "google_org_policy_policy" "gcp-asia-southeast1-org-policy-allow-vm-external-ip-bastion-001" {
  name   = "projects/${data.google_project.gcp-apse1-prj-sh-access-001.project_id}/policies/compute.vmExternalIpAccess"
  parent = "projects/${data.google_project.gcp-apse1-prj-sh-access-001.project_id}"

  spec {
    inherit_from_parent = false # override org-level deny_all
    rules {
      values {
        allowed_values = [
          "projects/${data.google_project.gcp-apse1-prj-sh-access-001.project_id}/zones/asia-southeast1-b/instances/gcp-asia-southeast1-vm-bastion-001",
        ]
      }
    }
  }

  # Make sure the org-level deny is applied first so the project exception clearly overrides it
  depends_on = [
    google_org_policy_policy.gcp-asia-southeast1-org-policy-deny-vm-external-ip-001,
  ]
}
