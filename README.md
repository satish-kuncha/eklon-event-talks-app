# BigQuery Release Notes Dashboard

An elegant, dark-themed Flask web application that parses the official Google Cloud BigQuery RSS release feed and provides an interactive interface to search, filter, and share updates directly to X (formerly Twitter).

---

## 🚀 Key Features

* **Real-time Live Feed**: Pulls and caches the official feed directly from Google Cloud Platform.
* **Granular Decomposition**: Splits bulk daily release entries into individual card items based on type.
* **Instant Filtering & Search**: Filter releases by type (Features, Changed, Deprecated, Issues) or search matching terms in real-time.
* **Interactive X/Twitter Composer**:
  * Customizable pre-drafted tweets with character length verification (max 280).
  * Interactive hashtag helper buttons.
  * Live visual mockup of the final tweet layout.
  * Instant Web Intent integration for direct posting.
* **Polished UX**: Smooth CSS micro-animations, glassmorphism UI components, and integrated toast notifications.

---

## 🛠️ Tech Stack

* **Backend**: Python 3, Flask
* **Libraries**: ElementTree (XML parsing), BeautifulSoup4 (HTML decomposition)
* **Frontend**: Plain Vanilla HTML5, CSS3, JavaScript (ES6)
* **Icons & Fonts**: FontAwesome, Google Fonts (Outfit & Plus Jakarta Sans)

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/satish-kuncha/eklon-event-talks-app.git
cd eklon-event-talks-app
```

### 2. Install Dependencies
Make sure you have Python 3 and `pip` installed. Run the following command:
```bash
pip install flask requests beautifulsoup4
```

### 3. Start the Application
Run the Flask server locally:
```bash
python app.py
```

### 4. View in Browser
Open your browser and navigate to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📖 Project Structure & Documentation

* **[`app.py`](app.py)**: The entry point Flask server containing core fetching and parsing logics.
* **[`templates/index.html`](templates/index.html)**: Interactive UI layout structure.
* **[`static/css/styles.css`](static/css/styles.css)**: Glassmorphic theme custom stylesheet.
* **[`static/js/app.js`](static/js/app.js)**: Frontend logic for search, modal controls, and tweet assembly.
* **[`ARCHITECTURE.md`](ARCHITECTURE.md)**: Detailed system layout, flowcharts, and network request sequence diagrams.
* **[`EXPLANATION_APP_PY.md`](EXPLANATION_APP_PY.md)**: Complete code commentary for the backend Flask script.
