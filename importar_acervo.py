#!/usr/bin/env python3
"""
Importa o acervo do Excel para o Firestore.

Uso:
  1. pip install openpyxl firebase-admin
  2. Coloque o arquivo serviceAccountKey.json nesta pasta
     (baixe em Firebase Console → Configurações do projeto → Contas de serviço)
  3. python3 importar_acervo.py --dry-run   # só testa, não grava nada
  4. python3 importar_acervo.py             # importa de verdade

O script é idempotente: usa título + categoria como chave
para evitar duplicatas em rodadas repetidas.
"""

import re
import sys
from datetime import datetime, timezone

try:
    import openpyxl
except ImportError:
    print("❌  Instale openpyxl:  pip install openpyxl")
    sys.exit(1)

# ── Configuração ──────────────────────────────────────────────────────────────

EXCEL_PATH = "acervo_completo.xlsx"
SERVICE_ACCOUNT = "serviceAccountKey.json"

SHEET_TO_CATEGORY = {
    "Catálogos de Exposição":          "Catálogos de Exposição",
    "Fotografia":                       "Fotografia",
    "História, Sociologia, Antrop...":  "História, Sociologia, Antropologia, Educação",
    "Povos Indígenas e Populações...":  "Povos Indígenas e Populações Tradicionais",
    "Políticas Públicas":               "Políticas Públicas",
    "Políticas Culturais":              "Políticas Culturais",
    "Música":                           "Música",
    "Dança":                            "Dança",
    "Cinema":                           "Cinema",
    "Teatro":                           "Teatro",
    "Artes Plásticas, Artesanato":      "Artes Plásticas, Artesanato",
    "Patrimônio":                       "Patrimônio",
    "Romance":                          "Romance",
    "Poesia":                           "Poesia",
    "Infantil e Infanto-Juvenil":       "Infantil e Infanto-Juvenil",
    "Didáticos":                        "Didáticos",
    "Sertão-Gerais":                    "Sertão-Gerais",
    "Cerrado":                          "Cerrado",
    "Educação Ambiental":               "Educação Ambiental",
    "Meio Ambiente":                    "Meio Ambiente",
    "Mosaico Sertão Veredas-Peruaçu":  "Mosaico Sertão Veredas-Peruaçu",
    "Turismo":                          "Turismo",
}

YEAR_RE = re.compile(r'\b(19|20)\d{2}\b|s/d|sem data', re.IGNORECASE)


# ── Parsing ───────────────────────────────────────────────────────────────────

def parse_book_data(raw: str):
    """Extrai author e title do campo cru (AUTOR+TÍTULO+ANO+ASSUNTO colados)."""
    if not raw:
        return "", ""
    raw = raw.strip()

    # Corta o assunto (tudo a partir do ano)
    m = YEAR_RE.search(raw)
    before_year = raw[:m.start()].strip() if m else raw

    # Heurística: autor tem vírgula nos primeiros 60 chars (Sobrenome, Nome)
    comma_pos = before_year.find(",")
    if 0 < comma_pos < 60:
        after_comma = before_year[comma_pos + 1:].strip()
        name_end = re.search(r'\s+(?=[A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ(\"\"])', after_comma)
        if name_end:
            fname = after_comma[:name_end.start()].strip()
            author = before_year[:comma_pos].strip() + ", " + fname
            title = after_comma[name_end.start():].strip()
        else:
            author = before_year[:comma_pos].strip()
            title = after_comma.strip()
    else:
        # Sem vírgula: entidade — separa pelo dois-pontos ou travessão
        words = before_year.split()
        author, title = "", before_year
        for i, w in enumerate(words):
            if i == 0:
                continue
            if ":" in w or "–" in w or (w == "-" and i > 0):
                author = " ".join(words[:i])
                title = " ".join(words[i:]).lstrip(":–- ")
                break
        if not author and len(words) > 3:
            author = " ".join(words[:3])
            title = " ".join(words[3:])

    return author.strip(), title.strip()


def extract_books(excel_path: str) -> list:
    wb = openpyxl.load_workbook(excel_path)
    books = []

    for sheet_name, category in SHEET_TO_CATEGORY.items():
        if sheet_name not in wb.sheetnames:
            print(f"  ⚠️  Aba não encontrada: {sheet_name}")
            continue

        ws = wb[sheet_name]
        last_book = None

        for row in ws.iter_rows(min_row=3, values_only=True):
            num, raw = row[0], row[1]
            if not num or not raw:
                continue

            num_str = str(num).strip()
            raw_str = str(raw).strip()

            if num_str.lower() == "idem":
                if last_book:
                    last_book["totalQuantity"] += 1
                    last_book["availableQuantity"] += 1
                continue

            author, title = parse_book_data(raw_str)
            if not title:
                title = raw_str[:120]

            last_book = {
                "title": title,
                "author": author,
                "category": category,
                "totalQuantity": 1,
                "availableQuantity": 1,
                "status": "available",
            }
            books.append(last_book)

    return books


# ── Importação ────────────────────────────────────────────────────────────────

def import_to_firestore(books: list):
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore as fs
    except ImportError:
        print("❌  Instale firebase-admin:  pip install firebase-admin")
        sys.exit(1)

    cred = credentials.Certificate(SERVICE_ACCOUNT)
    firebase_admin.initialize_app(cred)
    db = fs.client()

    col = db.collection("books")
    now = datetime.now(timezone.utc)

    print("🔍  Verificando livros já cadastrados no Firestore...")
    existing = set()
    for doc in col.stream():
        d = doc.to_dict()
        existing.add((d.get("title", "").lower(), d.get("category", "").lower()))

    novos = 0
    duplicatas = 0

    print(f"📚  Importando {len(books)} títulos...\n")
    for book in books:
        key = (book["title"].lower(), book["category"].lower())
        if key in existing:
            duplicatas += 1
            continue

        col.add({**book, "createdAt": now, "updatedAt": now})
        existing.add(key)
        novos += 1
        print(f"  ✅  [{book['category']}] {book['title'][:60]}")

    print(f"\n🎉  Pronto!")
    print(f"    Novos livros adicionados : {novos}")
    print(f"    Duplicatas ignoradas     : {duplicatas}")
    total_ex = sum(b["totalQuantity"] for b in books)
    print(f"    Total de exemplares      : {total_ex}")


# ── Dry-run (sem gravar no Firebase) ─────────────────────────────────────────

def dry_run(books: list):
    print(f"\n📋  DRY RUN — {len(books)} títulos únicos extraídos do Excel:\n")
    by_cat: dict = {}
    by_copies: dict = {}
    for b in books:
        c = b["category"]
        by_cat[c] = by_cat.get(c, 0) + 1
        by_copies[c] = by_copies.get(c, 0) + b["totalQuantity"]

    for cat in sorted(by_cat):
        print(f"  {cat:<47} {by_cat[cat]:>3} títulos  ({by_copies[cat]} exemplares)")

    total_t = sum(by_cat.values())
    total_e = sum(by_copies.values())
    print(f"\n  {'TOTAL':<47} {total_t:>3} títulos  ({total_e} exemplares)")

    print("\n  Exemplo dos 3 primeiros livros parseados:")
    for b in books[:3]:
        print(f"    Título : {b['title'][:70]}")
        print(f"    Autor  : {b['author']}")
        print(f"    Cat    : {b['category']}  |  Exemplares: {b['totalQuantity']}")
        print()

    print("  💡  Para importar de verdade, execute sem --dry-run")
    print("      (precisa do arquivo serviceAccountKey.json)")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    dry = "--dry-run" in sys.argv or "-n" in sys.argv

    print("📖  Lendo o Excel...")
    books = extract_books(EXCEL_PATH)

    if dry:
        dry_run(books)
    else:
        import_to_firestore(books)
