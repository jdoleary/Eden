import { assertEquals } from "https://deno.land/std@0.196.0/assert/assert_equals.ts";

export function isUpdateNewer(currentVersion: string, updateVersion: string): boolean {
    const [MAJOR, MINOR, PATCH] = currentVersion.split('.');
    const [MAJOR_UPDATE, MINOR_UPDATE, PATCH_UPDATE] = updateVersion.split('.');
    const majorNewer = parseInt(MAJOR_UPDATE) > parseInt(MAJOR);
    const majorEqual = parseInt(MAJOR_UPDATE) == parseInt(MAJOR);
    const minorNewer = parseInt(MINOR_UPDATE) > parseInt(MINOR);
    const minorEqual = parseInt(MINOR_UPDATE) == parseInt(MINOR);
    const patchNewer = parseInt(PATCH_UPDATE) > parseInt(PATCH);
    return (majorNewer || (majorEqual && minorNewer) || (majorEqual && minorEqual && patchNewer));
}
type isUpdateNewerTestCase = [string, string, boolean?];
([
    ['0.1.0', '0.1.0', false],
    // Major
    ['0.1.0', '1.1.0', true],
    // Patch
    ['0.1.1', '0.1.2', true],
    // Minor
    ['0.1.0', '1.2.0', true],
    // fool minor 
    ['1.1.0', '0.2.0', false],
    // fool patch and minor
    ['1.1.1', '0.2.2', false],
    // fool patch 
    ['1.1.1', '0.1.2', false],
    ['1.3.1', '1.2.2', false],
] as isUpdateNewerTestCase[]).map(([currentVersion, updateVersion, expected]) => {
    Deno.test({
        name: `isUpdateNewer: ${currentVersion},${updateVersion}->${expected} `, fn: () => {
            const actual = isUpdateNewer(currentVersion, updateVersion);
            assertEquals(actual, expected)
        },
    });
});