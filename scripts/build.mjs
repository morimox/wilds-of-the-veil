import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const file = async path => (await readFile(new URL(path, root), "utf8")).replace(/\r\n/g, "\n");
const [html, style, intro, river, zhao, sand, late, puzzles, mechanisms, tournament, world, training, data, economy, alchemy, ferry, hazards, caravan, employers, border, hunts, dyke, ridge, kit, innerStyles, banditContentSource, bandits, tactics, engine, app] = await Promise.all([
  file("game.html"), file("style.css"), file("intro.css"), file("river-content.mjs"), file("zhao-content.mjs"), file("sand-content.mjs"),
  file("late-content.mjs"), file("puzzle-content.mjs"), file("mechanisms.mjs"), file("tournament.mjs"), file("world.mjs"), file("training.mjs"), file("data.mjs"), file("economy.mjs"),
  file("alchemy.mjs"), file("ferry-content.mjs"), file("hazards.mjs"), file("caravan-content.mjs"),
  file("employers-content.mjs"), file("border-content.mjs"), file("hunt-materials.mjs"), file("dyke-armory.mjs"), file("ridge-armory.mjs"),
  file("explorer-kit.mjs"), file("inner-style-content.mjs"), file("bandit-content.mjs"), file("bandits.mjs"), file("combat-tactics.mjs"), file("engine.mjs"), file("app.mjs"),
]);
const originalCss = `${style}\n${intro}`;
const destination = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL("dist/雾渡山河.html", root));

// Embed the local images so the resulting HTML can open independently.
let css = originalCss;
for (const [reference, path, type] of originalCss.matchAll(/url\("\.\/(assets\/[a-z-]+\.(webp|png))"\)/g)) {
  const bytes = await readFile(new URL(path, root));
  css = css.replace(reference, `url("data:image/${type};base64,${bytes.toString("base64")}")`);
}

// Each module is scoped separately so the standalone bundle behaves like the module build.
function moduleBody(source) {
  return source
    .replace(/^import .*?;[ \t]*\r?$/gm, "")
    .replace(/^export (?:default .+;|\{[^}]*\};)[ \t]*\r?$/gm, "")
    .replace(/^export (?=(?:const|function) )/gm, "");
}

const script = `(() => {
const { riverContent, extendSites, extendEvents } = (() => {
${moduleBody(river)}
return { riverContent, extendSites, extendEvents };
})();
const zhaoContent = (() => {
${moduleBody(zhao)}
return zhaoContent;
})();
const sandContent = (() => {
${moduleBody(sand)}
return sandContent;
})();
const lateContent = (() => {
${moduleBody(late)}
return lateContent;
})();
const puzzleContent = (() => {
${moduleBody(puzzles)}
return puzzleContent;
})();
const { tournamentContent, tournamentData, initialTournament, tournamentView, tournamentAction, tournamentResolution } = (() => {
${moduleBody(tournament)}
return { tournamentContent, tournamentData, initialTournament, tournamentView, tournamentAction, tournamentResolution };
})();
const ferryContent = (() => {
${moduleBody(ferry)}
return ferryContent;
})();
const { hazardContent, hazardView, hazardAction, hazardVictory } = (() => {
${moduleBody(hazards)}
return { hazardContent, hazardView, hazardAction, hazardVictory };
})();
const caravanContent = (() => {
${moduleBody(caravan)}
return caravanContent;
})();
const employersContent = (() => {
${moduleBody(employers)}
return employersContent;
})();
const borderContent = (() => {
${moduleBody(border)}
return borderContent;
})();
const huntMaterialContent = (() => {
${moduleBody(hunts)}
return huntMaterialContent;
})();
const dykeArmoryContent = (() => {
${moduleBody(dyke)}
return dykeArmoryContent;
})();
const ridgeArmoryContent = (() => {
${moduleBody(ridge)}
return ridgeArmoryContent;
})();
const explorerKitContent = (() => {
${moduleBody(kit)}
return explorerKitContent;
})();
const innerStyleContent = (() => {
${moduleBody(innerStyles)}
return innerStyleContent;
})();
const banditContent = (() => {
${moduleBody(banditContentSource)}
return banditContent;
})();
const moduleData = (() => {
${moduleBody(data)}
return { default: data, ...data };
})();
const { data } = (() => ({ data: moduleData.default }))();
const { alwaysKnownRegion, learnAdjacentRegions, settlementOf, initialWorld, worldView, worldAction, travelRoad, rescueSettlement, continueRoad, backFromRoad, roadTripView } = (() => {
${moduleBody(world)}
return { alwaysKnownRegion, learnAdjacentRegions, settlementOf, initialWorld, worldView, worldAction, travelRoad, rescueSettlement, continueRoad, backFromRoad, roadTripView };
})();
const { banditRules, checkRoadBanditStep, roadBanditRisk, roadBanditView, banditAction, winRoadBandit, deferBanditRecruits } = (() => {
${moduleBody(bandits)}
return { banditRules, checkRoadBanditStep, roadBanditRisk, roadBanditView, banditAction, winRoadBandit, deferBanditRecruits };
})();
const { initialTraining, trainingStats, trainingPerks, restoreTrainingSense, needsSenseRest, trainingView, trainingAction, recordTrainingRead } = (() => {
${moduleBody(training)}
return { initialTraining, trainingStats, trainingPerks, restoreTrainingSense, needsSenseRest, trainingView, trainingAction, recordTrainingRead };
})();
const { initialMechanisms, mechanismView, mechanismAction } = (() => {
${moduleBody(mechanisms)}
return { initialMechanisms, mechanismView, mechanismAction };
})();
const economyModule = (() => {
${moduleBody(economy)}
return { economyData, initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo, backpackCapacity, backpackName, saleQuote, saleTotal, recordSale };
})();
const { economyData, initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo, backpackCapacity, backpackName, saleQuote, saleTotal, recordSale } = economyModule;
const { alchemyData, initialAlchemyState, alchemyView, alchemyAction } = (() => {
${moduleBody(alchemy)}
return { alchemyData, initialAlchemyState, alchemyView, alchemyAction };
})();
const { chooseEnemyIntent } = (() => {
${moduleBody(tactics)}
return { chooseEnemyIntent };
})();
const { act, createGame, handConflict, rules, view } = (() => {
${moduleBody(engine)}
return { act, createGame, handConflict, rules, view };
})();
${moduleBody(app)}
})();`.replace(/<\/script/gi, "<\\/script");

const result = html
  .replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`)
  .replace('  <link rel="stylesheet" href="./intro.css">\n', "")
  .replace('  <script type="module" src="./app.mjs"></script>\n', "")
  .replace("</body>", () => `<script>\n${script}\n</script>\n</body>`);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, "<!-- 由 scripts/build.mjs 生成。请编辑 game.html 与源码。 -->\n" + result, "utf8");
console.log(destination);
