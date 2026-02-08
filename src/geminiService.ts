import * as https from 'node:https';
import { GeminiModel, GeminiResponse } from './types';

const GEMINI_ENDPOINT = 'generativelanguage.googleapis.com';

function getModelPath(model: GeminiModel): string {
  return `/v1beta/models/${model}:generateContent`;
}

const SYSTEM_PROMPT = `Sen deneyimli bir yazılımcısın. Sana verilen git diff çıktısını analiz edip Conventional Commits v1.0.0 spesifikasyonuna tam uyumlu bir commit mesajı üreteceksin. Mesaj, bir insan geliştiricinin elle yazacağı gibi doğal ve anlaşılır olmalı.

CONVENTIONAL COMMITS v1.0.0 SPESİFİKASYONU — ZORUNLU KURALLAR:

Aşağıdaki kurallar https://www.conventionalcommits.org/tr/v1.0.0/ adresindeki resmi spesifikasyondan alınmıştır. Tamamına uyMALISIN.

1. Her commit mesajı bir tip ile başlaMALI, ardından SEÇMELİ bir kapsam, SEÇMELİ bir ! işareti ve ZORUNLU bir iki nokta üst üste işareti ve bir adet boşluk gelMELİ.
2. feat tipi, uygulamaya yeni bir özellik ekliyorsa kullanılMALI (SemVer MINOR).
3. fix tipi, uygulamadaki bir hatayı düzeltiyorsa kullanılMALI (SemVer PATCH).
4. Tip bilgisinden sonra bir kapsam belirtilEBİLİR. Kapsam parantez içinde kodun hangi bölümünün değiştiğini açıklayan bir isimden oluşMALI. Örneğin fix(parser):.
5. Açıklama, tip/kapsam bilgilerinden sonraki iki nokta ve boşluktan hemen sonra yazılMALI. Açıklama yapılan değişikliği anlatan kısa bir özettir.
6. Kısa açıklamadan sonra daha uzun bir mesaj metni yazılABİLİR. Mesaj metni açıklamadan sonra boş bir satırdan sonra başlaMALI.
7. Mesaj metni serbest şekildedir ve boş bir satırla ayrılan herhangi bir sayıda paragraftan oluşABİLİR.
8. Bir ya da birden fazla alt metin, mesaj metninden bir boş satır sonra koyulABİLİR. Her alt metin bir anahtar kelime ile başlaMALI, anahtar kelime ya :<boşluk> ile ya da <boşluk># ayraçları ile bir metne bağlanMALI.
9. Alt metin anahtar kelimesi boşluk yerine - kullanMALI (örn: Acked-by). Buna istisna olarak sadece BREAKING CHANGE kalıbı anahtar kelime olarak kullanılABİLİR.
10. Alt metin birden fazla boşluk ve satır içerEBİLİR ve bir sonraki geçerli anahtar kelimeye ulaştığında bitmiş olMALI.
11. Köklü değişiklikler ya tip/kapsam içinde ! ile ya da alt metin olarak belirtilMELİ.
12. Alt metin içinde belirtiliyorsa, köklü değişiklik büyük harflerle BREAKING CHANGE ile başlaMALI, iki nokta, boşluk ve açıklama ile devam etMELİ.
13. Tip/kapsam içinde belirtiliyorsa, köklü değişiklikler : işaretinden önce ! ile belirtilMELİ. ! kullanılırsa alt metinde BREAKING CHANGE: kullanılMAYABİLİR.
14. feat ve fix dışındaki tipler de kullanılABİLİR: build, chore, ci, docs, style, refactor, perf, test, revert. Bu tipler commit mesaj metninde (body) de tekrar kullanılABİLİR.
15. Conventional Commits kalıpları büyük/küçük harf duyarlı olarak düşünülMEMELİ. Buna tek istisna BREAKING CHANGE kalıbıdır — her zaman büyük harfle yazılMALI.
16. Alt metinde anahtar olarak kullanılırken BREAKING-CHANGE şeklinde (tire ile) de yazılABİLİR.

MESAJ YAPISI:

<tip>[isteğe bağlı kapsam][isteğe bağlı !]: <açıklama>

[isteğe bağlı mesaj metni]

[isteğe bağlı alt metin(ler)]

TİP SEÇİMİ (tip her zaman İngilizce ve küçük harf):
- feat: Yeni özellik, fonksiyon, sınıf, dosya ekleme
- fix: Hata düzeltme, null check, try-catch, validation düzeltme, crash çözme
- docs: README, .md dosyası, JSDoc, yorum satırı değişikliği
- style: Whitespace, format, noktalı virgül, CSS/SCSS — kod davranışı değişmez
- refactor: Kod yapısı değişikliği, rename, extract method — davranış değişmez
- perf: Performans iyileştirme, sorgu optimizasyonu, cache ekleme
- test: Test dosyası ekleme veya güncelleme
- build: Build sistemi, bağımlılık değişikliği (package.json, gradle, Dockerfile)
- ci: CI/CD dosyası değişikliği (GitHub Actions, Jenkinsfile, .gitlab-ci.yml)
- chore: Sabit değer değişikliği, config güncelleme, küçük bakım işleri
- revert: Önceki bir commit'i geri alma

KAPSAM KURALLARI:
- Kapsam İngilizce kalacak
- Kodun hangi bölümünün değiştiğini açıklayan bir isim olMALI
- Tek dosya değiştiyse: dosyanın bulunduğu modül veya klasör adı (auth, api, core, utils)
- Birden fazla dosya aynı modüldeyse: ortak modül adı
- Farklı modüllerdeyse: en anlamlı modül adı veya kapsam belirtme
- Kapsam zorunlu değil — emin değilsen belirtme

AÇIKLAMA KURALLARI:
- Açıklama MUTLAKA TÜRKÇE yazılacak
- Türkçe emir kipi kullan: ekle, düzelt, güncelle, kaldır, iyileştir, yeniden yapılandır, sadeleştir, optimize et
- Değişikliğin ne yaptığını özetle
- Kısa ve öz ama anlaşılır ol — kesilmiş veya eksik kelime OLMAMALI
- Tek dosya: ne değiştiğini spesifik belirt
- Birden fazla dosya: değişikliklerin ortak amacını özetle

MESAJ METNİ (BODY) KURALLARI:
- Diff karmaşıksa veya birden fazla farklı amaçlı değişiklik içeriyorsa mesaj metni ekle
- Açıklamadan sonra bir boş satır bırakarak başla
- Değişikliklerin detaylarını Türkçe açıkla
- Önemli değişiklikleri "- " ile listele
- Basit, tek amaçlı değişikliklerde mesaj metni ekleme

ALT METİN (FOOTER) KURALLARI:
- Mesaj metninden bir boş satır sonra koyulABİLİR
- Her alt metin bir anahtar kelime ile başlaMALI
- Anahtar kelime :<boşluk> veya <boşluk># ile metne bağlanMALI
- Anahtar kelimede boşluk yerine - kullan (örn: Reviewed-by, Refs)
- BREAKING CHANGE istisnadır — boşluklu yazılABİLİR
- Örnek: Refs #133
- Örnek: Reviewed-by: Z
- Örnek: BREAKING CHANGE: eski API kaldırıldı

KÖKLÜ DEĞİŞİKLİK (BREAKING CHANGE):
- Geriye dönük uyumluluğu bozan değişiklik varsa:
  - Ya tip/kapsam sonuna ! ekle: feat(api)!: ...
  - Ya da alt metinde BREAKING CHANGE: ile belirt
  - İkisi birden de kullanılABİLİR
- BREAKING CHANGE her zaman büyük harfle yazılMALI

ÇIKTI KURALLARI:
- Sadece commit mesajını döndür, başka hiçbir şey yazma
- Açıklama, yorum, markdown, backtick, tırnak işareti KULLANMA
- Mesaj bir insan geliştiricinin elle yazdığı gibi doğal olmalı

ÖRNEKLER:

Basit değişiklik:
feat(auth): kullanıcı giriş ekranı eklendi

Hata düzeltme:
fix(api): token yenileme sırasında oluşan null pointer hatası düzeltildi

Config değişikliği:
chore(core): triggerDay değeri güncellendi

Dokümantasyon:
docs: CHANGELOG'daki yazım hataları düzeltildi

Kapsam ile özellik:
feat(lang): Türkçe çeviri eklendi

Birden fazla dosya, karmaşık değişiklik:
chore: proje bağımlılıkları ve yapılandırma dosyaları güncellendi

- paket sürümleri yükseltildi
- eslint kuralları düzenlendi
- tsconfig strict modu etkinleştirildi

Köklü değişiklik (! ile):
feat!: müşteriye ürünü kargolandığında mail atma özelliği eklendi

Köklü değişiklik (kapsam ve ! ile):
feat(api)!: müşteriye ürünü kargolandığında mail atma özelliği eklendi

Köklü değişiklik (alt metin ile):
feat: config nesnelerinin birbirinden türetilmesi sağlandı

BREAKING CHANGE: extends kelimesi artık başka bir ayar dosyasından türetildiğini belirtiyor

Köklü değişiklik (! ve alt metin birlikte):
chore!: Node 6 desteği kaldırıldı

BREAKING CHANGE: Sadece Node 6 içinde olan Javascript özellikleri kullanan yerler yeniden yazılmalı.

Birden fazla alt metin:
fix: bazı küçük yazım hataları düzeltildi

Detaylar için ilgili issue'ya bakabilirsiniz.

Reviewed-by: Z
Refs #133

Geri alma (SHA referansı alt metinde belirtilMELİ):
revert: önceki değişiklik geri alındı

Refs: 676104e, a215868

ÖNEMLI KURALLAR:
- Değişiklikler birden fazla tipe uygunsa, en baskın olan tipi seç. Tek bir commit mesajı üret.
- Tip her zaman küçük harf olMALI (feat, fix, docs, vb.). BREAKING CHANGE hariç büyük/küçük harf duyarsızdır ama tutarlılık için küçük harf kullan.
- Açıklama satırı (ilk satır) mümkün olduğunca kısa ve öz olMALI ama kesilmiş veya eksik kelime OLMAMALI.`;

export function cleanResponse(text: string): string {
  let cleaned = text.trim();

  let changed = true;
  while (changed) {
    changed = false;
    const trimmed = cleaned.trim();
    if (trimmed !== cleaned) {
      cleaned = trimmed;
      changed = true;
    }
    if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
      cleaned = cleaned.slice(1, -1);
      changed = true;
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length >= 2) {
      cleaned = cleaned.slice(1, -1);
      changed = true;
    }
    if (cleaned.startsWith('`') && cleaned.endsWith('`') && cleaned.length >= 2) {
      cleaned = cleaned.slice(1, -1);
      changed = true;
    }
  }

  return cleaned.trim();
}

function buildRequestBody(diff: string, stat: string, maxOutputTokens: number): string {
  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        parts: [{ text: `GIT DIFF STAT:\n${stat}\n\nGIT DIFF:\n${diff}` }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens,
      topP: 0.8,
      topK: 40,
    },
  };

  return JSON.stringify(body);
}

function extractMessageFromResponse(response: GeminiResponse): string {
  if (response.error) {
    throw new Error(
      `Gemini API hatası (kod ${response.error.code}): ${response.error.message}`
    );
  }

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API yanıtından commit mesajı çıkarılamadı');
  }

  return text;
}

export async function generateCommitMessage(
  diff: string,
  stat: string,
  apiKey: string,
  maxOutputTokens: number = 8192,
  model: GeminiModel = 'gemini-2.5-flash'
): Promise<string> {
  const requestBody = buildRequestBody(diff, stat, maxOutputTokens);
  const path = `${getModelPath(model)}?key=${apiKey}`;

  const options: https.RequestOptions = {
    hostname: GEMINI_ENDPOINT,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    },
  };

  return new Promise<string>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk: Buffer | string) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          let errorMessage = `HTTP ${res.statusCode}`;
          try {
            const errorResponse = JSON.parse(data) as GeminiResponse;
            if (errorResponse.error?.message) {
              errorMessage = errorResponse.error.message;
            }
          } catch {
            if (data) {
              errorMessage = data.substring(0, 200);
            }
          }
          reject(
            new Error(
              `Gemini API hatası (HTTP ${res.statusCode}): ${errorMessage}`
            )
          );
          return;
        }

        try {
          const response = JSON.parse(data) as GeminiResponse;
          const rawText = extractMessageFromResponse(response);
          const commitMessage = cleanResponse(rawText);
          resolve(commitMessage);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Bilinmeyen hata';
          reject(new Error(`Gemini API yanıtı işlenemedi: ${message}`));
        }
      });
    });

    req.on('error', (error: Error) => {
      reject(new Error(`Gemini API'ye bağlanılamadı: ${error.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}
