import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button
} from '@mantine/core'
import {
  IconHeart, IconHeartFilled
} from '@tabler/icons-react'
import { 
  toggleLike
} from '../../queries/feed'

export default function LikeButton({ postId, userId, likedPostIds, likesCount }) {
  const queryClient = useQueryClient()
  const liked = likedPostIds.includes(postId)

  const { mutate, isPending } = useMutation({
    mutationFn: () => toggleLike({ postId, userId, liked }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['likedPosts', userId] })
      await queryClient.cancelQueries({ queryKey: ['likesCount'] })

      const previousLiked = queryClient.getQueryData(['likedPosts', userId])
      const previousCount = queryClient.getQueryData(
        queryClient.getQueryCache().findAll({ queryKey: ['likesCount'] })[0]?.queryKey
      )

      // Atualiza lista de posts curtidos
      queryClient.setQueryData(['likedPosts', userId], (old = []) =>
        liked ? old.filter(id => id !== postId) : [...old, postId]
      )

      // Atualiza o mapa de contagens
      const countKey = queryClient.getQueryCache()
        .findAll({ queryKey: ['likesCount'] })[0]?.queryKey
      if (countKey) {
        queryClient.setQueryData(countKey, (old = {}) => ({
          ...old,
          [postId]: Math.max(0, (old[postId] ?? 0) + (liked ? -1 : 1)),
        }))
      }

      return { previousLiked, previousCount, countKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(['likedPosts', userId], context.previousLiked)
      }
      if (context?.countKey && context?.previousCount !== undefined) {
        queryClient.setQueryData(context.countKey, context.previousCount)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likedPosts', userId] })
      queryClient.invalidateQueries({ queryKey: ['likesCount'] })
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
          (likesCount > 0) 
            ?
              liked
                ? <IconHeartFilled size={20} color="red" />
                : <IconHeart size={20} />
            : undefined
        }
        aria-label={liked ? 'Descurtir' : 'Curtir'}
        title={liked ? 'Descurtir' : 'Curtir'}
        loading={isPending}
        onClick={() => mutate()}
        style={{ cursor: isPending ? 'default' : 'pointer' }}
      >
        {(likesCount === 0) ? 
          liked
            ? <IconHeartFilled size={24} color="red" />
            : <IconHeart size={24} />
          : undefined
        }
        {likesCount > 0 ? likesCount : ''}
      </Button>
  )
}
