/** Matches only the new route; ordinary storefront paths keep their existing sync. */
export function isExperiencePath(pathname:string){
 return /^\/(?:en\/|nl\/|fr\/|es\/|it\/)?experience\/?$/.test(pathname);
}
export function isFixtureExperience(pathname:string,fixtureMarker:boolean){
 return isExperiencePath(pathname)&&fixtureMarker;
}
