const textBoundary = String.raw`(^|[\s,.;:()[\]{}"'“”‘’\-/])`;
const thaiNameTitlePattern = new RegExp(`${textBoundary}(นาย|นาง|นางสาว|นส\\.|ด\\.ช\\.?|ด\\.ญ\\.?|ดช|ดญ)(?=$|[\\s,.;:()[\\]{}"'“”‘’\\-/])`);
const englishNameTitlePattern = /\b(?:Mr\.?|Mrs\.?|Ms\.?|Miss)\s+[A-Z][A-Za-z'-]{1,}\b/;

export function containsLikelyPatientIdentifier(text: string) {
  return thaiNameTitlePattern.test(text) || englishNameTitlePattern.test(text);
}
