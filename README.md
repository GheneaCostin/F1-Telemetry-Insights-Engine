#  Telemetry Insights Engine

A high-performance, **full-stack microservices application** designed to fetch, process, and visualize Formula 1 telemetry data. This project leverages a multi-tier architecture, containerization, and orchestration to provide deep insights into driver performance.

##  System Architecture

Unlike standard monolithic apps, this system is built as a distributed cluster of services:

* **Frontend (React/Vite):** A modern UI utilizing Tailwind CSS and Recharts to render live telemetry data, lap comparisons, and track maps.
* **Gateway (C# .NET 9):** Acts as a high-speed Reverse Proxy and traffic controller, managing requests between the client and the data engine.
* **Data Engine (Python/FastAPI):** The mathematical core of the project. It interfaces with FastF1, utilizing Pandas and NumPy for data cleaning and telemetry extraction.
* **Orchestration (Kubernetes):** The entire stack is orchestrated via K8s, managing pod lifecycles, internal service DNS, and persistent storage.

<img width="1412" height="664" alt="image" src="https://github.com/user-attachments/assets/0024530b-b79f-46d5-b9df-5e1c934ea1e5" />



##  Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts |
| **API Gateway** | C# .NET 9, ASP.NET Core |
| **Data Logic** | Python 3.12, FastAPI, FastF1, Pandas |
| **Infrastructure** | Kubernetes, Docker, WSL2 |
| **Storage** | Kubernetes Persistent Volume Claims (PVC) |

##  Key Engineering Highlights

* **Kubernetes Orchestration:** Implemented a local K8s cluster to manage service discovery and scalability.
* **Persistent Data Caching:** Configured Persistent Volumes (PV) to cache heavy F1 data files (multi-GB) on physical storage, drastically reducing API latency and external data calls.
* **Cross-Language Integration:** Engineered a seamless bridge between a C# Gateway and a Python Engine, utilizing internal cluster networking for secure communication.
* **Resource Optimization:** Optimized Docker build stages and storage management to handle large virtualized disk images (vhdx) across system partitions.

## Getting Started

### Prerequisites
* Docker Desktop (with Kubernetes enabled)
* Node.js (for local frontend development)

<img width="1201" height="350" alt="image" src="https://github.com/user-attachments/assets/7eb1f369-23ac-4c98-a990-60e5e51e4431" />

<img width="1222" height="883" alt="image" src="https://github.com/user-attachments/assets/6737db1f-11a8-4c94-8af2-dd1cbbb1e06f" />


### Deployment
1. **Build Images:**
   ```powershell
   docker build -t f1-backend:latest ./python-backend
   docker build -t f1-gateway:latest ./csharp-gateway
