Here is the complete **README.md** content. You can copy the code block below and paste it directly into your GitHub repository.

````markdown
# 🕉️ IndicWisdom AI

**A Native Android Application for Multilingual Lifestyle & Mythology Q&A**

![Kotlin](https://img.shields.io/badge/Kotlin-1.9.0-purple.svg?style=flat&logo=kotlin)
![Jetpack Compose](https://img.shields.io/badge/UI-Jetpack_Compose-blue.svg?style=flat&logo=android)
![Python](https://img.shields.io/badge/Backend-FastAPI-green.svg?style=flat&logo=python)
![Firebase](https://img.shields.io/badge/Auth-Firebase-orange.svg?style=flat&logo=firebase)

---

## 📖 Overview

**IndicWisdom** is a vernacular-first AI assistant designed to make global AI intelligence accessible to Indian users in their native languages (Telugu, Hindi, English). 

The app answers questions regarding lifestyle, Indian mythology, and culture by aggregating responses from multiple top-tier AI models (Gemini, GPT-4, Llama). It features a unique **Translation Bridge** that converts vernacular voice input into English for processing and returns the answer in the user's local language.

---

## ✨ Key Features

* **🗣️ Real-Time Vernacular Voice Input:**
    * Supports **Telugu, Hindi, and English**.
    * **Live Transcription Overlay:** Users see their speech converted to text in real-time to ensure accuracy before sending.
* **🧠 Multi-Model Consensus:**
    * Queries **Google Gemini 1.5**, **GPT-4o**, and **Llama 3** simultaneously.
    * Presents answers in a swipeable **Card Carousel** for comparison.
* **🔄 The Translation Bridge:**
    * Automated pipeline: `Local Speech` -> `Text` -> `English Translation` -> `AI Query` -> `Local Translation`.
* **📲 Social-First Sharing:**
    * One-tap sharing to **WhatsApp, Instagram Stories, Facebook, and Messaging**.
    * Pre-formatted text payloads ensuring easy readability.
* **🔊 Text-to-Speech (TTS):**
    * Native audio playback for answers in Telugu and Hindi.

---

## 🛠️ Tech Stack

### **Android Client (Mobile)**
* **Language:** Kotlin
* **UI Framework:** Jetpack Compose (Material 3 Design)
* **Architecture:** MVVM (Model-View-ViewModel) + Clean Architecture
* **Dependency Injection:** Hilt
* **Networking:** Retrofit + OkHttp
* **Asynchronous:** Coroutines + Flow

### **Backend (Serverless)**
* **Framework:** Python FastAPI
* **Hosting:** AWS Lambda / Google Cloud Run
* **Orchestration:** LangChain (For managing parallel model requests)
* **Translation:** Google Cloud Translation API (Advanced V3)

### **AI & Models**
* **Primary:** OpenAI GPT-4o
* **Speed:** Google Gemini 1.5 Flash
* **Open Source:** Llama 3 (via Groq)

---

## 🚀 How It Works (User Flow)

1.  **Auth:** User logs in via Phone Number (Firebase Auth).
2.  **Selection:** User toggles language header to **Telugu**.
3.  **Input:** * User holds the **Mic Button**.
    * App displays **Live Telugu Text** (using Android `SpeechRecognizer`).
4.  **Processing:** * Telugu text is sent to the backend.
    * Backend translates it to English.
    * English prompt is sent to all 3 AI models.
    * AI responses are translated back to Telugu.
5.  **Output:** App displays 3 answer cards.
6.  **Action:** User taps **WhatsApp Icon** to share the best answer instantly.

---

## 📸 Screenshots

| Home Screen | Voice Input | AI Results |
|:---:|:---:|:---:|
| *(Place image here)* | *(Place image here)* | *(Place image here)* |

---

## 📦 Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/indic-wisdom.git](https://github.com/yourusername/indic-wisdom.git)
    ```

2.  **Configure Firebase:**
    * Add your `google-services.json` file to the `/app` directory.

3.  **Configure API Keys:**
    * Create a `local.properties` file in the root directory.
    * Add the following:
        ```properties
        BASE_URL="your_backend_url"
        ```

4.  **Build and Run:**
    * Open in Android Studio Ladybug (or newer).
    * Sync Gradle and Run on Emulator/Device.

---

## 🤝 Contribution

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
````
