import json
import time

from django.core.management.base import BaseCommand, CommandError

from organizations.models import Organization
from chat.retrieval import retrieve

MODES = ['vector', 'hybrid', 'full']
LABELS = {'vector': 'vector only', 'hybrid': 'hybrid (BM25 + vector)', 'full': 'hybrid + rerank'}


class Command(BaseCommand):
    help = "Score retrieval quality across modes. A case is a hit if every expected phrase appears in the retrieved chunks."

    def add_arguments(self, parser):
        parser.add_argument('--org', type=int, required=True)
        parser.add_argument('--file', default='rag_eval.json')

    def handle(self, *args, **opts):
        try:
            org = Organization.objects.get(pk=opts['org'])
        except Organization.DoesNotExist:
            raise CommandError(f"Organization {opts['org']} not found")

        try:
            with open(opts['file'], encoding='utf-8') as f:
                cases = json.load(f)
        except FileNotFoundError:
            raise CommandError(f"{opts['file']} not found")

        for mode in MODES:  # warm-up, so model loading doesn't skew the timings
            retrieve(org, 'warm up', mode=mode)

        totals = {m: {'hits': 0, 'ms': 0.0} for m in MODES}
        misses = {m: [] for m in MODES}

        for case in cases:
            needles = [n.lower() for n in case['expect']]
            for mode in MODES:
                start = time.perf_counter()
                results = retrieve(org, case['question'], mode=mode)
                totals[mode]['ms'] += (time.perf_counter() - start) * 1000

                retrieved = ' '.join(r['text'] for r in results).lower()
                if all(n in retrieved for n in needles):
                    totals[mode]['hits'] += 1
                else:
                    misses[mode].append(case['question'])

        n = len(cases)
        self.stdout.write(f"\n{n} questions, org '{org.name}'\n")
        self.stdout.write(f"{'mode':<26}{'hit rate':<14}{'avg ms'}")
        for mode in MODES:
            t = totals[mode]
            self.stdout.write(f"{LABELS[mode]:<26}{t['hits']}/{n} ({t['hits'] / n:.0%}){'':<3}{t['ms'] / n:.0f}")

        for mode in MODES:
            if misses[mode]:
                self.stdout.write(f"\nMissed by {LABELS[mode]}:")
                for q in misses[mode]:
                    self.stdout.write(f"  - {q}")