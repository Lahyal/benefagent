#!/usr/bin/env python3
"""
Run this script from the root of the benefagent repo.
It adds related articles blocks + E-E-A-T author schema to all 18 blog posts.

Usage: python3 add_seo_fixes.py
"""

import os, re

BLOG_DIR = "blog"  # relative to repo root

articles = {
    "hsa-fsa-eligible-expenses-2026.html":          {"title": "HSA & FSA Eligible Expenses 2026: The Complete List",                                    "topics": ["hsa","fsa","eligible","expenses"]},
    "401k-employer-match.html":                      {"title": "401k Employer Match: How to Get Every Dollar You're Owed",                               "topics": ["401k","match","employer"]},
    "fsa-deadline-2026.html":                        {"title": "FSA Deadline 2026: What Happens If You Don't Use It",                                    "topics": ["fsa","deadline"]},
    "how-to-submit-hsa-claim.html":                  {"title": "How to Submit an HSA Claim: Step by Step",                                              "topics": ["hsa","claim","reimbursement"]},
    "hsa-vs-fsa.html":                              {"title": "HSA vs FSA: Which One Is Right for You in 2026",                                         "topics": ["hsa","fsa","comparison"]},
    "hsa-contribution-limits-2026.html":             {"title": "2026 HSA Contribution Limits: Individual, Family & Catch-Up",                           "topics": ["hsa","limits","contribution"]},
    "hdhp-hsa-qualify.html":                         {"title": "What Is an HDHP and Do You Qualify for an HSA?",                                        "topics": ["hsa","hdhp","qualify"]},
    "surprising-hsa-eligible-expenses.html":         {"title": "Sunscreen, Therapy, Gym: What's Actually HSA Eligible in 2026",                         "topics": ["hsa","fsa","eligible","expenses"]},
    "how-to-read-benefits-pdf.html":                 {"title": "How to Read Your Employee Benefits PDF (And What to Look For)",                         "topics": ["benefits","pdf","employer"]},
    "open-enrollment-checklist-2026.html":           {"title": "Benefits Open Enrollment 2026: The 9-Minute Checklist",                                 "topics": ["benefits","enrollment"]},
    "average-employee-leaves-8400.html":             {"title": "The Average Employee Leaves $8,400 in Benefits Unclaimed Every Year",                    "topics": ["benefits","unclaimed","employer"]},
    "new-hsa-rules-2026.html":                       {"title": "New 2026 HSA Rules: Bronze and Catastrophic Plans Now Qualify",                         "topics": ["hsa","rules","qualify"]},
    "commuter-benefits-explained.html":              {"title": "Commuter Benefits: How to Save $300/Month Pre-Tax",                                     "topics": ["benefits","commuter"]},
    "average-401k-employer-match.html":              {"title": "What Is the Average 401k Employer Match in 2026?",                                      "topics": ["401k","match","employer","average"]},
    "how-much-to-contribute-401k-employer-match.html":{"title": "How Much Should You Contribute to Your 401k If Your Employer Matches 3%?",             "topics": ["401k","match","contribute"]},
    "does-401k-employer-match-count-as-income.html": {"title": "Does Your 401k Employer Match Count as Taxable Income?",                               "topics": ["401k","match","income","tax"]},
    "does-employer-match-count-toward-401k-limit.html":{"title": "Does Employer 401k Match Count Toward the $23,500 Contribution Limit?",              "topics": ["401k","match","limit"]},
    "do-employers-match-catch-up-contributions.html":{"title": "Do Employers Match 401k Catch-Up Contributions?",                                       "topics": ["401k","match","catch-up"]},
    "can-i-pay-medical-bill-with-hsa.html":          {"title": "Can I Pay a Medical Bill with My HSA?",                                                "topics": ["hsa","claim","reimbursement","medical"]},
    "fsa-grace-period-2026.html":                    {"title": "FSA Grace Period 2026: Do You Have Extra Time to Spend?",                              "topics": ["fsa","deadline","grace","rollover"]},
    "fsa-use-it-or-lose-it-rules-2026.html":         {"title": "FSA Use It or Lose It Rules 2026: What You Need to Know",                              "topics": ["fsa","deadline","rules","rollover"]},
    "how-to-maximize-401k-employer-match.html":      {"title": "How to Maximize Your 401k Employer Match in 2026",                                     "topics": ["401k","match","employer","maximize"]},
    "how-to-reimburse-yourself-from-hsa.html":       {"title": "How to Reimburse Yourself from Your HSA: Step by Step",                                "topics": ["hsa","claim","reimbursement"]},
    "hsa-reimbursement-deadline.html":               {"title": "HSA Reimbursement Deadline: How Long Do You Have?",                                    "topics": ["hsa","deadline","reimbursement","rules"]},
    "is-minoxidil-hsa-eligible.html":                {"title": "Is Minoxidil HSA or FSA Eligible in 2026?",                                            "topics": ["hsa","fsa","eligible","expenses"]},
    "is-ozempic-hsa-eligible.html":                  {"title": "Is Ozempic or Wegovy HSA or FSA Eligible in 2026?",                                    "topics": ["hsa","fsa","eligible","expenses","prescription"]},
    "is-therapy-hsa-eligible.html":                  {"title": "Is Therapy HSA or FSA Eligible in 2026?",                                              "topics": ["hsa","fsa","eligible","expenses","therapy"]},
    "401k-monthly-income-calculator.html":            {"title": "How Much Will My 401(k) Pay Me Per Month? Calculator & Examples (2026)",          "topics": ["401k","retirement","calculator","income"]},
    "401k-balance-for-1000-monthly.html":             {"title": "How Much Do I Need in My 401(k) for $1,000 Per Month?",                              "topics": ["401k","retirement","savings","income"]},
    "retire-at-62-with-400k-401k.html":               {"title": "Can I Retire at 62 With $400,000 in My 401(k)?",                                      "topics": ["401k","retirement","early retirement"]},
    "401k-vesting-schedule-explained.html":          {"title": "401(k) Vesting Schedule Explained",                                                     "topics": ["401k","vesting","employer","match"]},
    "what-is-a-good-401k-match.html":                {"title": "What Is a Good 401k Employer Match? (2026 Benchmarks)",                                "topics": ["401k","match","employer","benchmark"]},
}

AUTHOR_SCHEMA = '''  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "BenefAgent Editorial Team",
    "url": "https://www.benefagent.com",
    "worksFor": {
      "@type": "Organization",
      "name": "BenefAgent",
      "url": "https://www.benefagent.com",
      "logo": "https://www.benefagent.com/og-image.png",
      "sameAs": ["https://twitter.com/benefagent"]
    },
    "knowsAbout": ["HSA", "FSA", "401k", "Employee Benefits", "Health Insurance", "Retirement Planning"]
  }
  </script>'''

def get_related(filename, count=3):
    current = articles.get(filename, {}).get("topics", [])
    scores = {}
    for fn, data in articles.items():
        if fn == filename:
            continue
        scores[fn] = len(set(current) & set(data["topics"]))
    return [fn for fn, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:count]]

def related_block(filename):
    related = get_related(filename)
    items = ""
    for fn in related:
        title = articles[fn]["title"]
        is_401k = "401k" in fn
        is_benefits = not ("hsa" in fn or "fsa" in fn or "401k" in fn)
        tag = "401k" if is_401k else "Benefits" if is_benefits else "HSA / FSA"
        color = "#d4541a" if is_benefits else "#1a7a5e"
        items += f"""      <a href="{fn}" style="display:block;background:white;border-radius:12px;padding:20px 24px;text-decoration:none;border:1px solid rgba(14,14,13,.07);">
        <div style="display:inline-block;color:{color};font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border-radius:100px;margin-bottom:10px;background:rgba(26,122,94,.08);">{tag}</div>
        <div style="font-family:'DM Serif Display',serif;font-size:17px;color:#0e0e0d;line-height:1.3;">{title}</div>
      </a>\n"""
    return f"""
<div style="background:#ede9df;border-top:1px solid rgba(14,14,13,.08);padding:48px 24px;margin-top:0;">
  <div style="max-width:760px;margin:0 auto;">
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.1em;color:#7a7a72;margin-bottom:20px;">Related articles</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
{items}    </div>
  </div>
</div>"""

def process_file(filepath, filename):
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    changed = False

    # 1. Add author schema to <head> if not present
    if '"@type": "Person"' not in content and AUTHOR_SCHEMA not in content:
        content = content.replace('</head>', AUTHOR_SCHEMA + '\n</head>', 1)
        changed = True

    # 2. Add related articles before </body> if not present
    if 'Related articles' not in content:
        block = related_block(filename)
        content = content.replace('</body>', block + '\n</body>', 1)
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Run
updated = 0
skipped = 0
missing = 0

for filename in articles:
    filepath = os.path.join(BLOG_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  ⚠️  MISSING: {filename}")
        missing += 1
        continue
    if process_file(filepath, filename):
        print(f"  ✅ {filename}")
        updated += 1
    else:
        print(f"  ⏭  {filename} — already up to date")
        skipped += 1

print(f"\nDone — {updated} updated, {skipped} skipped, {missing} missing")
print("Next: git add blog/ && git commit -m 'SEO: related articles + author schema' && git push")
