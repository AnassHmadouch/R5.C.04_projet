# R5.C.04_projet

Projet d'analyse et d’affichages de certaines données issues de l’enquête lancée en 2023 par stackOverflow sur ses utilisateurs

configuration d'un dépôt git distant :
   - git config --global user.name <username>
   - git config --global user.email <email_git>

La récupération d'un dépôt git sur son poste :
   - git pull

Pour changer de branche :
  - git checkout <nom_branche>

Pour vérifier l'état de modification du projet :
  - git status

Pour commit les modifications sur une branche :
  - git add <fichiers_modifier, supprimer...> (pour sélectionner certain éléments)
  - git commit -m "DESCRIPTION COMMIT"
  - git push origin <nom_branche>

Pour push la totalité du projet vers le git distant :
  - git commit -a -m "DESCRIPTION COMMIT"

Pour annuler un commit :
  - git revert <commit à annuler>

