# Turkish Conventional Commits

Conventional Commits v1.0.0 spesifikasyonuna tam uyumlu, Türkçe commit mesajı üreten bir VS Code eklentisi. Google Gemini modelleriyle çalışır.

## Desteklenen modeller

| Model | Özellik |
|---|---|
| `gemini-3-flash-preview` | En yeni nesil model (önizleme) |
| `gemini-2.5-flash` | En gelişmiş kararlı model, yüksek kaliteli çıktı (varsayılan) |
| `gemini-2.5-flash-lite` | Hızlı ve ekonomik, iyi kalite |
| `gemini-2.0-flash` | Hızlı ve dengeli performans |
| `gemini-2.0-flash-lite` | En hızlı ve en ekonomik |

Source Control panelindeki butona tıklayın, değişiklikleriniz analiz edilsin, commit mesajınız hazır olsun.

## Ne yapar?

- Staged (veya tüm) değişiklikleri otomatik algılar
- Git diff çıktısını Gemini'ye gönderir
- Conventional Commits formatında Türkçe commit mesajı üretir
- Mesajı doğrudan Source Control giriş kutusuna yazar
- API erişilemezse şablon tabanlı fallback mesaj üretir

VS Code, Cursor, Kiro ve diğer VS Code tabanlı editörlerde çalışır. Harici npm bağımlılığı yoktur.

## Kurulum

Projeyi klonlayın, bağımlılıkları yükleyin, derleyin ve paketleyin:

```bash
npm install
npm run compile
npm run package
```

Oluşan `.vsix` dosyasını yüklemek için:

- `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`) ile komut paletini açın
- "Extensions: Install from VSIX..." komutunu çalıştırın
- `turkish-conventional-commits-1.0.0.vsix` dosyasını seçin

Ya da terminalden:

```bash
code --install-extension turkish-conventional-commits-1.0.0.vsix
```

## Yapılandırma

Ayarlar > Extensions > Turkish Conventional Commits yolundan erişebilirsiniz.

| Ayar | Açıklama | Varsayılan |
|---|---|---|
| `turkishCommits.enableGemini` | Gemini API kullanılsın mı | `true` |
| `turkishCommits.geminiApiKey` | Google Gemini API anahtarı | `""` |
| `turkishCommits.geminiModel` | Kullanılacak Gemini modeli | `"gemini-2.5-flash"` |
| `turkishCommits.includeScope` | Commit mesajına kapsam eklensin mi | `true` |
| `turkishCommits.maxDiffLength` | Gemini'ye gönderilecek maksimum diff karakter sayısı | `8000` |
| `turkishCommits.maxOutputTokens` | Gemini'nin üretebileceği maksimum token sayısı (thinking + çıktı) | `8192` |

Model seçimi için `turkishCommits.geminiModel` ayarını kullanın. Varsayılan olarak `gemini-2.5-flash` kullanılır.

Gemini'yi kullanmak istemiyorsanız `turkishCommits.enableGemini` ayarını kapatın. Bu durumda dosya durumuna göre basit şablon mesajları üretilir.

## Kullanım

1. Değişikliklerinizi yapın (isterseniz `git add` ile stage'leyin)
2. Source Control panelindeki sparkle butonuna tıklayın
3. Mesaj üretilir ve giriş kutusuna yazılır

Staged değişiklikler varsa yalnızca onlar analiz edilir. Yoksa tüm değişiklikler kullanılır.

## Conventional Commits formatı

Eklenti, [Conventional Commits v1.0.0](https://www.conventionalcommits.org/tr/v1.0.0/) spesifikasyonuna uygun mesajlar üretir.

Mesaj yapısı:

```
<tip>[kapsam][!]: <açıklama>

[mesaj metni]

[alt metin]
```

Tipler: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Birden fazla dosya değiştiğinde ve değişiklikler karmaşıksa, açıklamadan sonra mesaj metni (body) de eklenebilir. Köklü değişikliklerde tip veya kapsam sonuna `!` eklenir.

Örnekler:

```
feat(auth): kullanıcı giriş ekranı eklendi
fix(api): token yenileme sırasında oluşan null pointer hatası düzeltildi
chore(core): triggerDay değeri güncellendi
refactor(repository): veri katmanı sadeleştirildi
docs(readme): kurulum talimatları güncellendi
```

Birden fazla değişiklik içeren örnek:

```
chore: proje bağımlılıkları ve yapılandırma dosyaları güncellendi

- paket sürümleri yükseltildi
- eslint kuralları düzenlendi
- tsconfig strict modu etkinleştirildi
```

## API anahtarı alma

1. [Google AI Studio](https://aistudio.google.com/app/apikey) adresine gidin
2. "Create API Key" ile anahtar oluşturun
3. Anahtarı VS Code ayarlarında `turkishCommits.geminiApiKey` alanına yapıştırın

API anahtarı olmadan da eklenti çalışır. Bu durumda dosya durumuna göre basit şablon mesajları üretilir. Gemini'yi tamamen kapatmak için ayarlardan `turkishCommits.enableGemini` seçeneğini devre dışı bırakabilirsiniz.

## Gereksinimler

- VS Code 1.85.0 veya üzeri (ya da uyumlu editör)
- Git yüklü ve PATH'de erişilebilir
- Google Gemini API anahtarı (opsiyonel)

## Lisans

MIT
