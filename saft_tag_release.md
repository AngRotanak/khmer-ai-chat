Exactly — you’ve got the right idea. In GitHub, **`main` is the source of truth for production**, and in Vercel, production is always tied to the latest commit on `main`.  

That means:  
- You **cannot roll production back to a preview branch** (`feature/my-branch`) once it’s merged.  
- But you **can roll back production to an earlier deployment of `main`** in Vercel.  
- If you want extra safety, you should **back up `main`** (or tag releases) so you can restore a known good state if something breaks.  

---

### ✅ Best Practices for Rollback Safety
- **Tag releases**  
  - Example:  
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```  
  - This marks stable points in `main` so you can always check out that commit again.

- **Create backup branches**  
  - Before merging, you can branch off `main` (e.g. `backup/stable-v1`).  
  - If something breaks, you can quickly revert to that branch.

- **Use Vercel rollback**  
  - In Vercel dashboard → **Deployments tab**, find the last stable `main` deployment.  
  - Click **Promote to Production** → instantly restore that build.  
  - No Git changes required.

- **Protect main**  
  - Require PRs + Vercel checks to pass before merging.  
  - Prevents broken code from hitting production.

---

👉 So the workflow is: **Preview branches for testing → Merge into main for production → Rollback to earlier main deployments if needed → Keep backups/tags for extra safety.**  

Would you like me to show you how to set up **automatic release tags** in GitHub Actions, so every successful production deploy gets a backup tag automatically?