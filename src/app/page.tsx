"use client";

import { useMemo, useState } from "react";
import { LeaguePanel } from "@/components/league-panel";
import { PromotionResult } from "@/components/promotion-result";
import { evaluatePromotion, type LeagueData } from "@/lib/promotion";

const emptyLeague = (key: string): LeagueData => ({
  leagueKey: key,
  teams: [],
});

export default function HomePage() {
  const [aLeague, setALeague] = useState<LeagueData>(() => emptyLeague("a-lig"));
  const [bLeague, setBLeague] = useState<LeagueData>(() => emptyLeague("b-lig"));

  const verdict = useMemo(
    () => evaluatePromotion(bLeague, aLeague),
    [bLeague, aLeague],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-orange-600">
          FantastiLig
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          A / B Lig Yükselme Hesaplayıcı
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Yahoo Fantasy lig linkinizi girerek kategori galibiyetlerini çekin,
          pick-trade puanlarını ekleyin ve B lig şampiyonunun A lige yükselip
          yükselmeyeceğini anında görün.
        </p>
      </header>

      <PromotionResult verdict={verdict} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LeaguePanel
          title="A Lig"
          description="Mevcut ana lig — son sıradaki takım düşme adayıdır."
          accent="a"
          data={aLeague}
          onChange={setALeague}
        />
        <LeaguePanel
          title="B Lig"
          description="Yeni kurulacak lig — 1. sıradaki takım yükselme adayıdır."
          accent="b"
          data={bLeague}
          onChange={setBLeague}
        />
      </div>

      <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
        <h2 className="mb-2 font-semibold text-foreground">Nasıl çalışır?</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Her lig için Yahoo linkini yapıştırıp &quot;Yahoo&apos;dan veri
            çek&quot; deyin (özel liglerde OAuth token gerekir).
          </li>
          <li>
            Kategori galibiyet / mağlubiyet / beraberlik değerlerini normal sezon
            + play-off dahil olacak şekilde kontrol edin.
          </li>
          <li>
            Pick-trade puanlarını girin: B lig 1.&apos;si için verilen pickler
            eksi, A lig sonuncusu için alınan pickler artı değerdedir.
          </li>
          <li>
            Üstteki kart otomatik olarak yükselme kararını hesaplar.
          </li>
        </ol>
      </section>
    </main>
  );
}
