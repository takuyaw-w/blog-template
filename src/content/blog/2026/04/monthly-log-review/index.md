---
title: "Test Post: Monthly Log Review"
description: "Monthly Logs機能の見え方を単月記事で確認するためのテスト記事です。"
category: "Feature"
tags:
  - Monthly Log
  - Test
  - Archive
pubDate: "2026-04-10"
---

このテスト記事は、1本だけの記事がある月の表示を確認するために置いています。
2026-02 や 2026-03 は複数記事の月として、2026-04 は単独記事の月として比較できます。

## 確認ポイント

`/years/` では、2026-04 の Blog 数が 1 と表示されます。
月別詳細ページでは、サマリ文、タグ、Blogセクション、Projectsの空表示が自然に並ぶかを確認します。

## 表示の期待値

この月はタグに Monthly Log、Test、Archive を持っています。
他の月とは違うタグが出るため、頻出タグの表示が月ごとに変わっていることを見やすくなります。
