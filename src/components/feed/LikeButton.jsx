import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@mantine/core'
import { IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { toggleLike } from '../../queries/feed'

export default function LikeButton({ postId, userId, liked = false, likesCount = 0 }) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => toggleLike({ postId, userId, liked }),
    onMutate: async () => {
      // Cancela refetch do feed e do post detalhe
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      await queryClient.cancelQueries({ queryKey: ['post', String(postId)] })
      await queryClient.cancelQueries({ queryKey: ['post', postId] })

      // Snapshot para rollback
      const previousFeed = queryClient.getQueriesData({ queryKey: ['feed'] })
      const previousPost =
        queryClient.getQueryData(['post', String(postId), userId]) ||
        queryClient.getQueryData(['post', String(postId)])

      // 1. Atualiza feed infinito
      queryClient.setQueriesData({ queryKey: ['feed'] }, (old) => {
        if (!old) {
          return old
        }
        // old pode ser { pages: [...] } do useInfiniteQuery
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      likes_count: Math.max(0, (p.likes_count ?? 0) + (liked ? -1 : 1)),
                      viewer_has_liked: !liked,
                      likesCount: Math.max(
                        0,
                        (p.likesCount ?? p.likes_count ?? 0) + (liked ? -1 : 1),
                      ),
                    }
                  : p,
              ),
            ),
          }
        }
        return old
      })

      // 2. Atualiza post único (Post.jsx)
      queryClient.setQueriesData({ queryKey: ['post'] }, (old) => {
        if (!old || old.id !== postId) {
          return old
        }
        return {
          ...old,
          likes_count: Math.max(0, (old.likes_count ?? 0) + (liked ? -1 : 1)),
          viewer_has_liked: !liked,
        }
      })

      return { previousFeed, previousPost }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) {
        context.previousFeed.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
      if (context?.previousPost) {
        queryClient.setQueriesData({ queryKey: ['post'] }, context.previousPost)
      }
    },
    onSettled: () => {
      // Não invalida tudo de imediato pra manter o optimistic liso
      // Se quiser garantir consistência final, descomente:
      // queryClient.invalidateQueries({ queryKey: ['post', String(postId)] })
    },
  })

  return (
    <Button
      variant="subtle"
      color="gray"
      size="sm"
      radius="md"
      px={10}
      leftSection={
        likesCount > 0 ? (
          liked ? (
            <IconHeartFilled size={20} color="red" />
          ) : (
            <IconHeart size={20} />
          )
        ) : undefined
      }
      aria-label={liked ? 'Descurtir' : 'Curtir'}
      title={liked ? 'Descurtir' : 'Curtir'}
      loading={isPending}
      onClick={() => mutate()}
      style={{ cursor: isPending ? 'default' : 'pointer' }}
    >
      {likesCount === 0 ? (
        liked ? (
          <IconHeartFilled size={24} color="red" />
        ) : (
          <IconHeart size={24} />
        )
      ) : undefined}
      {likesCount > 0 ? likesCount : ''}
    </Button>
  )
}
