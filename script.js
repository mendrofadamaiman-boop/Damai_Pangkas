/* =====================================================
   PENGATURAN: ubah bagian ini sesuai usaha kamu
   ===================================================== */
const WA_NUMBER = "6285142196892"; // nomor WhatsApp: awali 62 (tanpa 0 dan tanpa +)
const SLOT_MENIT = 60;             // jarak antar jam booking (menit)
 
// Tarif (dalam rupiah). Ubah, tambah, atau hapus baris sesuai kebutuhan.
const TARIF = [
  { grup: "Cukur rambut", item: [
    { nama: "Anak-anak", ket: "Usia sampai 12 tahun", harga: 7000 },
    { nama: "Dewasa",    ket: "Usia 13 sampai 30 tahun", harga: 7000 },
    { nama: "Orang tua", ket: "Usia 30 tahun ke atas", harga: 7000 },
  ]},
  { grup: "Kumis & jenggot", item: [
    { nama: "Cukur kumis dan jenggot",          ket: "Dirapikan dan dibentuk", harga: 3000 },
  ]},
];
 
// Jadwal buka. Isi buka: null kalau tutup di hari itu. Format jam 24 jam "HH:MM".
const JADWAL = {
  1: { hari: "Senin",  buka: "13:00", tutup: "21:00" },
  2: { hari: "Selasa", buka: "13:00", tutup: "21:00" },
  3: { hari: "Rabu",   buka: "18:00", tutup: "22:00" },
  4: { hari: "Kamis",  buka: "18:00", tutup: "22:00" },
  5: { hari: "Jumat",  buka: "13:00", tutup: "21:00" },
  6: { hari: "Sabtu",  buka: "14:00", tutup: "21:00" },
  0: { hari: "Minggu", buka: "07:00", tutup: "22:00" }, 
};
/* ===================================================== */
 
const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const urutan = [1, 2, 3, 4, 5, 6, 0]; // Senin sampai Minggu
 
// Tarif & pilihan layanan
$("prices").innerHTML = TARIF.map((g) => `
  <div class="price-group"><h3>${g.grup}</h3>
    ${g.item.map((i) => `<div class="price-row"><div>${i.nama}<small>${i.ket}</small></div><strong>${rupiah(i.harga)}</strong></div>`).join("")}
  </div>`).join("");
 
$("layanan").innerHTML = '<option value="">Pilih layanan</option>' + TARIF.map((g) =>
  `<optgroup label="${g.grup}">${g.item.map((i) => `<option value="${i.nama} (${g.grup.toLowerCase()}) - ${rupiah(i.harga)}">${i.nama} – ${rupiah(i.harga)}</option>`).join("")}</optgroup>`).join("");
 
// Jadwal buka
const hariIni = new Date().getDay();
$("hours").innerHTML = urutan.map((d) => {
  const j = JADWAL[d];
  const jam = j.buka ? `${j.buka} – ${j.tutup}` : '<span class="closed">Tutup</span>';
  return `<tr class="${d === hariIni ? "today" : ""}"><td>${j.hari}</td><td>${jam}</td></tr>`;
}).join("");
 
// Status buka/tutup saat ini
function updateStatus() {
  const now = new Date(), j = JADWAL[now.getDay()], mnt = now.getHours() * 60 + now.getMinutes();
  const el = $("status");
  const buka = j.buka && mnt >= toMin(j.buka) && mnt < toMin(j.tutup);
  el.className = "status" + (buka ? " open" : "");
  el.textContent = buka ? `Buka sekarang · tutup pukul ${j.tutup}` : "Sedang tutup · lihat jadwal buka di bawah";
}
updateStatus();
 
// Slot jam sesuai tanggal
const tanggal = $("tanggal"), slots = $("slots");
const isoLokal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
tanggal.min = isoLokal(new Date());
 
function parseTanggal(v) { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); }
 
function renderSlots() {
  if (!tanggal.value) return;
  const tgl = parseTanggal(tanggal.value), j = JADWAL[tgl.getDay()];
  if (!j.buka) { slots.innerHTML = `<p class="hint">Maaf, hari ${j.hari} tutup. Silakan pilih tanggal lain.</p>`; return; }
  const sekarang = new Date();
  const hariIniDipilih = isoLokal(sekarang) === tanggal.value;
  const mntSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
  let html = "";
  for (let t = toMin(j.buka); t + SLOT_MENIT <= toMin(j.tutup); t += SLOT_MENIT) {
    if (hariIniDipilih && t <= mntSekarang) continue;
    html += `<label><input type="radio" name="jam" value="${toTime(t)}"><span>${toTime(t)}</span></label>`;
  }
  slots.innerHTML = html || '<p class="hint">Jam hari ini sudah habis. Silakan pilih tanggal lain.</p>';
}
tanggal.addEventListener("change", renderSlots);
 
// Kirim booking ke WhatsApp
$("bookingForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const nama = $("nama").value.trim(), layanan = $("layanan").value;
  const jam = document.querySelector('input[name="jam"]:checked');
  const err = $("error");
  if (!nama || !layanan || !tanggal.value || !jam) {
    err.textContent = "Lengkapi nama, layanan, tanggal, dan jam dulu ya.";
    return;
  }
  err.textContent = "";
  const tglPanjang = parseTanggal(tanggal.value).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const pesan = `Halo, saya ${nama}. Saya ingin booking cukur rambut:\n• Layanan: ${layanan}\n• Tanggal: ${tglPanjang}\n• Jam: ${jam.value}\n\nMohon konfirmasinya, terima kasih.`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`, "_blank");
});
 
// Tautan WhatsApp, tahun footer, menu ponsel
const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Halo, saya ingin tanya soal cukur rambut.")}`;
$("waLink").href = waUrl;
$("waFloat").href = waUrl;
$("year").textContent = new Date().getFullYear();
 
const menu = $("menu"), menuBtn = $("menuBtn");
menuBtn.addEventListener("click", () => {
  menuBtn.setAttribute("aria-expanded", menu.classList.toggle("open"));
});
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  menu.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
}));