const SEOUL = {
  name: "Seoul",
  country: "South Korea",
  latitude: 37.5665,
  longitude: 126.978,
};

const weatherNow = document.querySelector("#weatherNow");
const forecastStrip = document.querySelector("#forecastStrip");
const newsList = document.querySelector("#newsList");
const todayLabel = document.querySelector("#todayLabel");
const cityForm = document.querySelector("#cityForm");
const cityInput = document.querySelector("#cityInput");
const locateButton = document.querySelector("#locateButton");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const refreshNewsButton = document.querySelector("#refreshNewsButton");
const topicRow = document.querySelector("#topicRow");
const installButton = document.querySelector("#installButton");
const clockTime = document.querySelector("#clockTime");
const clockDate = document.querySelector("#clockDate");

let activeTopic = "tech";
let activePlace = SEOUL;
let installPromptEvent;

const weatherCodeMap = new Map([
  [0, ["맑음", "Sun"]],
  [1, ["대체로 맑음", "Sun"]],
  [2, ["부분적으로 흐림", "CloudSun"]],
  [3, ["흐림", "Cloud"]],
  [45, ["안개", "Fog"]],
  [48, ["서리 안개", "Fog"]],
  [51, ["약한 이슬비", "Rain"]],
  [53, ["이슬비", "Rain"]],
  [55, ["강한 이슬비", "Rain"]],
  [61, ["약한 비", "Rain"]],
  [63, ["비", "Rain"]],
  [65, ["강한 비", "Rain"]],
  [71, ["약한 눈", "Snow"]],
  [73, ["눈", "Snow"]],
  [75, ["강한 눈", "Snow"]],
  [80, ["소나기", "Rain"]],
  [81, ["소나기", "Rain"]],
  [82, ["강한 소나기", "Rain"]],
  [95, ["뇌우", "Storm"]],
  [96, ["우박을 동반한 뇌우", "Storm"]],
  [99, ["강한 우박 뇌우", "Storm"]],
]);

const iconMap = {
  Sun: "☀",
  CloudSun: "⛅",
  Cloud: "☁",
  Fog: "〰",
  Rain: "☂",
  Snow: "❄",
  Storm: "⚡",
};

const topicFeeds = {
  top: "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
  business:
    "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko",
  tech: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ko&gl=KR&ceid=KR:ko",
  world: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=ko&gl=KR&ceid=KR:ko",
};

const fallbackImages = {
  top: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=500&q=80",
  business:
    "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=500&q=80",
  tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80",
  world:
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=500&q=80",
};

function updateDateLabels() {
  const now = new Date();

  todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  clockTime.textContent = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  clockDate.textContent = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
}

async function fetchWeather(place) {
  weatherNow.innerHTML = '<p class="muted">날씨를 불러오는 중입니다.</p>';
  forecastStrip.innerHTML = "";

  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("weather");
    const data = await response.json();
    renderWeather(data, place);
  } catch {
    weatherNow.innerHTML =
      '<p class="muted">날씨 정보를 가져오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>';
  }
}

function renderWeather(data, place) {
  const current = data.current;
  const [label, iconName] = weatherCodeMap.get(current.weather_code) ?? ["알 수 없음", "Cloud"];
  const temp = Math.round(current.temperature_2m);
  const feels = Math.round(current.apparent_temperature);

  weatherNow.innerHTML = `
    <div class="temperature">${temp}°</div>
    <div class="weather-meta">
      <strong>${place.name}, ${place.country ?? ""}</strong>
      <span class="weather-summary">${iconMap[iconName]} ${label}</span>
      <div class="meta-grid">
        <div class="meta-item"><span>체감</span><b>${feels}°C</b></div>
        <div class="meta-item"><span>습도</span><b>${current.relative_humidity_2m}%</b></div>
        <div class="meta-item"><span>바람</span><b>${Math.round(current.wind_speed_10m)} km/h</b></div>
        <div class="meta-item"><span>강수 확률</span><b>${data.daily.precipitation_probability_max[0]}%</b></div>
      </div>
    </div>
  `;

  const dayFormatter = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });
  forecastStrip.innerHTML = data.daily.time
    .map((date, index) => {
      const [forecastLabel, forecastIcon] =
        weatherCodeMap.get(data.daily.weather_code[index]) ?? ["흐림", "Cloud"];
      return `
        <article class="forecast-day" title="${forecastLabel}">
          <strong>${index === 0 ? "오늘" : dayFormatter.format(new Date(date))}</strong>
          <span class="forecast-icon">${iconMap[forecastIcon]}</span>
          <span>${Math.round(data.daily.temperature_2m_min[index])}° / ${Math.round(
            data.daily.temperature_2m_max[index],
          )}°</span>
        </article>
      `;
    })
    .join("");
}

async function searchCity(city) {
  const params = new URLSearchParams({
    name: city,
    count: "1",
    language: "ko",
    format: "json",
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) throw new Error("geocode");
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) throw new Error("not-found");

  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

function locateUser() {
  if (!navigator.geolocation) {
    fetchWeather(SEOUL);
    return;
  }

  weatherNow.innerHTML = '<p class="muted">현재 위치를 확인하는 중입니다.</p>';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      activePlace = {
        name: "현재 위치",
        country: "",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      fetchWeather(activePlace);
    },
    () => fetchWeather(activePlace),
    { enableHighAccuracy: false, timeout: 7000, maximumAge: 1000 * 60 * 30 },
  );
}

async function fetchNews() {
  newsList.innerHTML = '<p class="muted">뉴스를 불러오는 중입니다.</p>';

  const params = new URLSearchParams({
    rss_url: topicFeeds[activeTopic],
  });

  try {
    const response = await fetch(`https://api.rss2json.com/v1/api.json?${params}`);
    if (!response.ok) throw new Error("news");
    const data = await response.json();
    if (data.status !== "ok") throw new Error("news-status");
    const articles = (data.items ?? []).filter((article) => article.link && article.title);
    renderNews(articles.slice(0, 10));
  } catch {
    newsList.innerHTML = `
      <p class="muted">
        뉴스를 가져오지 못했습니다.
        <a href="https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSkwyMHZNREZqYUdRU0FtVnVHZ0pWVXlnQVAB?hl=ko&gl=KR&ceid=KR:ko" target="_blank" rel="noreferrer">Google 뉴스 기술 섹션</a>에서 바로 확인할 수 있습니다.
      </p>
    `;
  }
}

function renderNews(articles) {
  if (!articles.length) {
    newsList.innerHTML = '<p class="muted">표시할 뉴스가 없습니다. 다른 주제를 눌러 보세요.</p>';
    return;
  }

  newsList.innerHTML = articles
    .map((article) => {
      const image = article.thumbnail || article.enclosure?.link || fallbackImages[activeTopic];
      const { title, source } = splitGoogleTitle(article.title);
      const description = stripHtml(article.description ?? "");
      const date = article.pubDate ? formatNewsDate(article.pubDate) : "";
      return `
        <a class="news-card" href="${article.link}" target="_blank" rel="noreferrer">
          <img src="${image}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <div class="news-card-content">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(description || source || "자세한 내용은 기사에서 확인하세요.")}</p>
            <span class="source-line">${escapeHtml(source || "Google 뉴스")} ${date}</span>
          </div>
        </a>
      `;
    })
    .join("");
}

function formatNewsDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function splitGoogleTitle(value) {
  const parts = String(value).split(" - ");
  if (parts.length < 2) return { title: value, source: "" };
  const source = parts.pop();
  return { title: parts.join(" - "), source };
}

function stripHtml(value) {
  const template = document.createElement("template");
  template.innerHTML = value;
  return template.content.textContent.replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return replacements[char];
  });
}

cityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    activePlace = await searchCity(city);
    cityInput.value = "";
    fetchWeather(activePlace);
  } catch {
    weatherNow.innerHTML =
      '<p class="muted">도시를 찾지 못했습니다. 영문 도시명으로 다시 입력해 주세요.</p>';
  }
});

locateButton.addEventListener("click", locateUser);
refreshNewsButton.addEventListener("click", fetchNews);

topicRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-topic]");
  if (!button) return;

  activeTopic = button.dataset.topic;
  document.querySelectorAll(".topic").forEach((topic) => topic.classList.remove("is-active"));
  button.classList.add("is-active");
  fetchNews();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPromptEvent) return;
  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = undefined;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installPromptEvent = undefined;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

updateDateLabels();
setInterval(updateDateLabels, 1000);
fetchWeather(activePlace);
fetchNews();
