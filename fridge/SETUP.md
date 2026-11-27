# ثلاجة بيتنا — تشغيل المزامنة (مرة وحدة)

1. ادخلوا على https://console.firebase.google.com واعملوا مشروع جديد (مجاني، بدون Google Analytics).
2. من القائمة: **Build → Firestore Database → Create database** → اختاروا موقع (مثلاً `eur3`) → **Production mode**.
3. بنفس الصفحة، تبويب **Rules**، امسحوا اللي فيه والصقوا هاد، وغيّروا `KOD-AL3ILEH` لكود سري بالإنجليزي والأرقام (هاد الكود اللي العيلة بتكتبه بالدخول):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{fam}/{doc=**} {
      allow read, write: if fam == 'KOD-AL3ILEH';
    }
  }
}
```
   واكبسوا **Publish**.
4. **Project settings (⚙️) → Your apps → </> (Web)** → سجّلوا تطبيق باسم `fridge` → انسخوا `firebaseConfig`.
5. افتحوا `fridge/config.js` بالـ GitHub والصقوا الإعدادات مكان `null`.

بعدها كل واحد من العيلة بيفتح https://nabaa12319.github.io/FHX/fridge/ ، بيكتب الكود واسمه مرة وحدة، وخلص.
