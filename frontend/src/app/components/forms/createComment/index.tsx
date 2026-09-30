"use client"

import { useState, FormEvent } from "react"
import commentService from "@/app/services/commentService";

// Mirrors the Worker's validator so most mistakes are caught before a round trip.
const LIMITS = { author: 100, title: 200, body: 5000 } as const;

type FormState = "idle" | "submitting" | "submitted";

const inputClassName = "w-full rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

const CreateCommentForm = ({
     slug
}: {
     slug: string
}): React.ReactElement => {
     const [state, setState] = useState<FormState>("idle");
     const [errors, setErrors] = useState<string[]>([]);

     const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);

          setState("submitting");
          setErrors([]);

          try {
               const result = await commentService.createComment(slug, {
                    author: String(data.get("author") ?? ""),
                    title: String(data.get("title") ?? ""),
                    body: String(data.get("body") ?? ""),
               });

               if (result.ok) {
                    form.reset();
                    setState("submitted");
               } else {
                    setErrors(result.errors);
                    setState("idle");
               }
          } catch {
               setErrors(["Couldn't reach the comments service. Please try again later."]);
               setState("idle");
          }
     }

     if (state === "submitted") {
          return (
               <div className="mt-6">
                    <p>Thanks! Your comment has been submitted and will appear once it has been reviewed.</p>
                    <button type="button" className="mt-2 text-sm text-sky-600 hover:underline dark:text-sky-400" onClick={() => setState("idle")}>
                         Write another comment
                    </button>
               </div>
          )
     }

     return (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
               <h3 className="text-lg font-semibold">Leave a comment</h3>
               <label className="flex flex-col gap-1 text-sm">
                    Name
                    <input name="author" required maxLength={LIMITS.author} className={inputClassName} />
               </label>
               <label className="flex flex-col gap-1 text-sm">
                    Title
                    <input name="title" required maxLength={LIMITS.title} className={inputClassName} />
               </label>
               <label className="flex flex-col gap-1 text-sm">
                    Comment
                    <textarea name="body" required maxLength={LIMITS.body} rows={5} className={inputClassName} />
               </label>
               {errors.length > 0 &&
                    <ul role="alert" className="text-sm text-red-600 dark:text-red-400">
                         {errors.map(error => <li key={error}>{error}</li>)}
                    </ul>
               }
               <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="self-start rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
                    {state === "submitting" ? "Submitting..." : "Submit comment"}
               </button>
          </form>
     )
}

export default CreateCommentForm;
