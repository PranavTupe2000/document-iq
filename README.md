<p align="center">
  <img src="docs/document-iq-banner.svg" alt="Document-IQ Banner"/>
</p>

Document-IQ is a **cloud-native document intelligence platform** designed to process, analyze, and query enterprise documents using  **AI, distributed systems, and event-driven microservices** .

The platform provides a complete pipeline for:

<pre class="overflow-visible! px-0!" data-start="595" data-end="696"><div class="relative w-full my-4"><div class=""><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼk ͼy"><div class="cm-scroller"><div class="cm-content q9tKkq_readonly"><span>Document Upload → OCR → Classification → Layout Understanding → Knowledge Retrieval → AI Chat</span></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></pre>

It demonstrates  **real-world AI system design** , including:

* Event-driven microservices
* ML pipelines and model registry
* Retrieval Augmented Generation (RAG)
* Multi-tenant SaaS architecture
* Observability and distributed tracing

---

# System Architecture

Document-IQ is designed as a **distributed microservices architecture** connected through  **Kafka event streams** .

![Architecture](docs/architecture-diagram.svg)
Key design principles:

* **Loose coupling via Kafka**
* **Independent microservices**
* **Async document processing**
* **Horizontal scalability**

---

# Document Processing Pipeline

The system processes documents through multiple stages.
![Pipeline](docs/document-pipeline.svg)

---

# Key Features

## Multi-Tenant SaaS Platform

* Organization-based workspaces
* Role-based access control (Admin / Member)
* Secure document isolation

---

## Event-Driven Architecture

The system uses **Kafka** for asynchronous processing.

Benefits:

* High throughput
* Fault isolation
* Service decoupling
* Scalability

---

## AI-Powered Document Understanding

Document-IQ integrates  **machine learning and deep learning models** .

### Document Classification

Classifies document types using engineered text features.

Example features:

* token count
* line count
* average line length
* table detection

These features form a  **feature contract used across training and inference** .

---

### Layout Detection

The layout engine detects document structure such as:

* Header
* Text
* Table
* Footer

This enables  **layout-aware document understanding** .

---

### AI Chat over Documents (RAG)

Users can query documents using natural language.

Example questions:

* *"Summarize this document"*
* *"What dates are mentioned?"*
* *"List key action items"*

Pipeline:

![RAG](docs/rag-architecture.svg)
---

# Observability Stack

Document-IQ includes  **production-grade observability** .

![Observability](docs/observability-architecture.svg)

This enables:

* distributed tracing
* centralized logging
* system debugging
* performance monitoring

---

# Project Structure

<pre class="overflow-visible! px-0!" data-start="5441" data-end="6245"><div class="relative w-full my-4"><div class=""><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼk ͼy"><div class="cm-scroller"><div class="cm-content q9tKkq_readonly"><span>.</span><br/><span>├── document-iq/</span><br/><span>│</span><br/><span>│   ├── document-iq-core</span><br/><span>│   │   Shared schemas, configs, ML utilities</span><br/><span>│</span><br/><span>│   ├── document-iq-ml-pipeline</span><br/><span>│   │   Classical ML training pipelines</span><br/><span>│</span><br/><span>│   ├── document-iq-dl-pipeline</span><br/><span>│   │   Deep learning layout training</span><br/><span>│</span><br/><span>│   └── document-iq-platform</span><br/><span>│       ├── components</span><br/><span>│       │   ├── account-component</span><br/><span>│       │   ├── application-component</span><br/><span>│       │   ├── ingestion-worker</span><br/><span>│       │   ├── ocr-adapter</span><br/><span>│       │   ├── classification-engine</span><br/><span>│       │   ├── layout-engine</span><br/><span>│       │   ├── rag-engine</span><br/><span>│       │   └── aggregator</span><br/><span>│       │</span><br/><span>│       ├── gateways</span><br/><span>│       │   └── ui-bff</span><br/><span>│       │</span><br/><span>│       ├── shared</span><br/><span>│       │   └── platform shared code</span><br/><span>│       │</span><br/><span>│       ├── ui-portal</span><br/><span>│       │   React frontend</span><br/><span>│       │</span><br/><span>│       └── docker-compose.yml</span><br/><span>│</span><br/><span>└── infra</span><br/><span>    └── terraform</span></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></pre>

This separation allows:

* ML pipelines to evolve independently
* platform services to scale independently
* infrastructure to be managed separately. Document-iq folder structure

---

# Technology Stack

## Backend

* Python
* FastAPI
* Kafka
* PostgreSQL
* Redis

## AI / ML

* Scikit-learn
* PyTorch
* MLflow
* Feature contracts

## Infrastructure

* Docker
* Docker Compose
* Terraform

## Observability

* OpenTelemetry
* Loki
* Promtail
* Tempo
* Grafana

## Frontend

* React
* React Router
* Context API

---

# ML Infrastructure

The platform includes  **ML lifecycle management** .

Capabilities:

* experiment tracking
* model versioning
* production model registry

Example model loading:

<pre class="overflow-visible! px-0!" data-start="6951" data-end="7106"><div class="relative w-full my-4"><div class=""><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼk ͼy"><div class="cm-scroller"><div class="cm-content q9tKkq_readonly"><span class="ͼn">def</span><span></span><span class="ͼt">load_production_model</span><span>(</span><span class="ͼt">model_name</span><span>: </span><span class="ͼt">str</span><span>):</span><br/><span></span><span class="ͼt">model_uri</span><span></span><span class="ͼn">=</span><span></span><span class="ͼr">f"models:/</span><span>{</span><span class="ͼt">model_name</span><span>}</span><span class="ͼr">/Production"</span><br/><span></span><span class="ͼn">return</span><span></span><span class="ͼt">mlflow</span><span class="ͼn">.</span><span>pyfunc</span><span class="ͼn">.</span><span>load_model(</span><span class="ͼt">model_uri</span><span>)</span></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></pre>

This ensures  **consistent model deployment across services** . document-iq-core

---

# Running the Platform

## Clone Repository

<pre class="overflow-visible! px-0!" data-start="7259" data-end="7341"><div class="relative w-full my-4"><div class=""><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼk ͼy"><div class="cm-scroller"><div class="cm-content q9tKkq_readonly"><span class="ͼs">git</span><span> clone https://github.com/PranavTupe2000/document-iq</span><br/><span class="ͼs">cd</span><span> document-iq</span></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></pre>

---

## Start Platform

<pre class="overflow-visible! px-0!" data-start="7367" data-end="7436"><div class="relative w-full my-4"><div class=""><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼk ͼy"><div class="cm-scroller"><div class="cm-content q9tKkq_readonly"><span>cd document-iq/document-iq-platform</span><br/><span>docker compose up --build</span></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></pre>

This starts:

* Kafka
* Microservices
* Database
* Observability stack
* UI Portal

---

# Example Workflow

1️⃣ Create organization

2️⃣ Login to portal

3️⃣ Upload document

Processing pipeline:

<pre class="overflow-visible! px-0!" data-start="7640" data-end="7757"><div class="relative w-full my-4"><div class=""><div class="relative"><div class="h-full min-h-0 min-w-0"><div class="h-full min-h-0 min-w-0"><div class="border border-token-border-light border-radius-3xl corner-superellipse/1.1 rounded-3xl"><div class="h-full w-full border-radius-3xl bg-token-bg-elevated-secondary corner-superellipse/1.1 overflow-clip rounded-3xl lxnfua_clipPathFallback"><div class="pointer-events-none absolute inset-x-4 top-12 bottom-4"><div class="pointer-events-none sticky z-40 shrink-0 z-1!"><div class="sticky bg-token-border-light"></div></div></div><div class=""><div class="relative z-0 flex max-w-full"><div id="code-block-viewer" dir="ltr" class="q9tKkq_viewer cm-editor z-10 light:cm-light dark:cm-light flex h-full w-full flex-col items-stretch ͼk ͼy"><div class="cm-scroller"><div class="cm-content q9tKkq_readonly"><span>Upload</span><br/><span> ↓</span><br/><span>OCR</span><br/><span> ↓</span><br/><span>Classification</span><br/><span> ↓</span><br/><span>Layout Detection</span><br/><span> ↓</span><br/><span>Aggregation</span><br/><span> ↓</span><br/><span>Stored in platform</span><br/><span> ↓</span><br/><span>Query via AI Chat</span></div></div></div></div></div></div></div></div></div><div class=""><div class=""></div></div></div></div></div></pre>

---

# Why This Project Is Portfolio-Grade

Document-IQ demonstrates **real-world production engineering skills** including:

* Distributed systems design
* Event-driven architecture
* Microservices orchestration
* ML lifecycle management
* AI system deployment
* Observability and monitoring
* Multi-tenant SaaS systems

This type of system is similar to platforms built by:

* AWS Textract pipelines
* Google Document AI
* enterprise knowledge platforms

---

# Future Improvements

Planned enhancements:

* Transformer-based document classification
* LayoutLM for document understanding
* Vector database integration
* Kubernetes deployment
* autoscaling pipelines
* streaming ingestion

---

# Author

**Pranav Tupe**

Software Engineer | AI Systems | Distributed Systems

GitHub

[https://github.com/PranavTupe2000]()

LinkedIn

[https://www.linkedin.com/in/tupepranav/]()
