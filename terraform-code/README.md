# GCP Landing Zone — Terraform Infrastructure

Terraform codebase for a GCP Hub-Spoke Landing Zone including VPC networking, Kubernetes clusters (dev/prod), centralized observability, HA VPN to on-premises, and Global External Load Balancing.

---

## Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TB
    Internet((🌐 Internet))
    OnPrem[("🏢 On-Premises\nBGP ASN 65002")]

    subgraph HubPrj["📁 hub-net-001"]
        VPN["HA VPN Gateway\nBGP ASN 65001"]
        HubVPC["VPC Hub\n10.0.0.0/24"]
        VPN --- HubVPC
    end

    subgraph AccessPrj["📁 sh-access-001"]
        AccessVPC["VPC Shared-Access\n10.50.1.0/24"]
        Bastion["🖥️ Bastion VM\n10.50.1.100  •  public IP"]
        ExtLB["🌍 Global External LB\nHTTP :80  →  Grafana :3000"]
        AccessVPC --- Bastion
        AccessVPC --- ExtLB
    end

    subgraph DevHostPrj["📁 sh-vpc-dev-001  (Shared VPC host)"]
        DevVPC["VPC Shared-Dev\n10.10.0.0/20"]
        NATd["Cloud NAT"]
        DevVPC --- NATd
    end

    subgraph PrdHostPrj["📁 sh-vpc-prd-001  (Shared VPC host)"]
        PrdVPC["VPC Shared-Prod\n10.20.0.0/20"]
        NATp["Cloud NAT"]
        PrdVPC --- NATp
    end

    subgraph ObsPrj["📁 obs-001"]
        ObsVPC["VPC Observability\n10.60.1.0/24"]
        ObsVM["🖥️ Obs VM  10.60.1.10\nPrometheus · Loki · Tempo\nGrafana · Kafka · Alertmanager"]
        NATo["Cloud NAT"]
        ObsVPC --- ObsVM
        ObsVPC --- NATo
    end

    subgraph DevEnvPrj["📁 dev-env-001  —  subnet 10.10.1.0/24"]
        DevMaster["k8s-dev-master\n10.10.1.10"]
        DevW1["worker-1  10.10.1.20"]
        DevW2["worker-2  10.10.1.21"]
        DevW3["worker-3  10.10.1.22"]
    end

    subgraph PrdEnvPrj["📁 prd-env-001  —  subnet 10.20.1.0/24"]
        PrdMaster["k8s-prod-master\n10.20.1.10"]
        PrdW1["worker-1  10.20.1.20"]
        PrdW2["worker-2  10.20.1.21"]
        PrdW3["worker-3  10.20.1.22"]
    end

    DevEnvPrj -.->|"Shared VPC service project"| DevHostPrj
    PrdEnvPrj -.->|"Shared VPC service project"| PrdHostPrj

    HubVPC <-->|peering| DevVPC
    HubVPC <-->|peering| PrdVPC
    HubVPC <-->|peering| ObsVPC

    AccessVPC <-->|"direct peering"| DevVPC
    AccessVPC <-->|"direct peering"| PrdVPC
    AccessVPC <-->|"direct peering"| ObsVPC
    DevVPC    <-->|"direct peering"| ObsVPC
    PrdVPC    <-->|"direct peering"| ObsVPC

    Internet ==>|"HTTP :80"| ExtLB
    Internet ==>|"SSH :22"| Bastion
    OnPrem   <==>|"IPsec + BGP\n(over internet)"| VPN

    ExtLB ==>|"backend IG\nGrafana :3000"| ObsVM

    Bastion -.->|SSH| DevMaster & DevW1 & DevW2 & DevW3
    Bastion -.->|SSH| PrdMaster & PrdW1 & PrdW2 & PrdW3
    Bastion -.->|SSH| ObsVM

    DevW1 & DevW2 & DevW3 -.->|"metrics / logs"| ObsVM
    PrdW1 & PrdW2 & PrdW3 -.->|"metrics / logs"| ObsVM

    classDef vpc fill:#eef2ff,stroke:#818cf8
    classDef vm  fill:#f0fdfa,stroke:#2dd4bf
    classDef lb  fill:#f5f3ff,stroke:#a78bfa
    classDef ext fill:#fff7ed,stroke:#fb923c
    classDef nat fill:#fefce8,stroke:#facc15

    class HubVPC,DevVPC,PrdVPC,AccessVPC,ObsVPC vpc
    class Bastion,DevMaster,DevW1,DevW2,DevW3,PrdMaster,PrdW1,PrdW2,PrdW3,ObsVM vm
    class ExtLB,VPN lb
    class Internet,OnPrem ext
    class NATd,NATp,NATo nat
```

---

## Prerequisites

### 1. Tools
*   Terraform `>= 1.5.0`
*   Google Cloud SDK (`gcloud`)

### 2. Multi-Billing Setup (Free Tier Quota)
To stay within GCP Free Tier project quotas, this infra is split across two billing accounts:
*   **Billing Account 1**: Managed Hub, Access, and Observability projects.
*   **Billing Account 2**: Managed Dev and Prod host/service projects.

### 3. Automated Initialization
Run the setup script in **GCP Cloud Shell** to create the entire Folder/Project hierarchy and the GCS State bucket:

```bash
# In Cloud Shell
chmod +x setup-gcp.sh
./setup-gcp.sh
```

---

## Configuration

1.  **Backend**: Terraform state is stored in `gs://gcp-apse1-tf-state-54431047904` (configured in `backend.tf`).
2.  **Variables**: Copy `terraform.tfvars.example` to `terraform.tfvars`.
3.  **Sensitive Data**: Fill in `user_email`, `vpn_shared_secrets`, and `onprem_vpn_public_ips` in `terraform.tfvars`.

---

## Deploy

```bash
terraform init
terraform plan
terraform apply
```

---

## Essential Outputs

After deployment, use these values for your Ansible inventory and access:

| Output | Description |
|---|---|
| `bastion_host_public_ip` | Entry point for SSH/Ansible. |
| `load_balancer_ip` | Access Grafana Dashboard at `http://<ip>`. |
| `observability_vm_private_ip` | Internal IP of Obs VM for metric collection. |
| `vpn_gateway_interface_0_ip` | Peer IP 1 for on-prem VPN config. |
| `vpn_gateway_interface_1_ip` | Peer IP 2 for on-prem VPN config. |

---

## File Structure

*   `setup-gcp.sh`: Automation for folders/projects/billing.
*   `backend.tf`: GCS remote state config.
*   `compute-*.tf`: Modularized network, peering, firewall, and VM resources.
*   `cloud-*.tf`: VPN, NAT, Load Balancing, Logging, and Monitoring.
*   `iam.tf`: Service account and role management.
