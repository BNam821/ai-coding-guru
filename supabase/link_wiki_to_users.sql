-- Link wiki_posts.author to users.username to enable Joins
ALTER TABLE public.wiki_posts
ADD CONSTRAINT fk_wiki_author
FOREIGN KEY (author)
REFERENCES public.users(username)
ON DELETE SET NULL;
