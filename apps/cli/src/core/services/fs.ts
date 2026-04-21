import { FileSystem } from '@effect/platform'
import { Context, Effect, Layer, pipe } from 'effect'
import { FileIOError } from '@/types/error'

// 借助平台能力，但转化为领域错误
interface FsService {
  readonly exists: (path: string) => Effect.Effect<boolean, FileIOError>
  readonly readFileString: (path: string) => Effect.Effect<string, FileIOError>
  readonly writeFileString: (path: string, content: string) => Effect.Effect<void, FileIOError>
  readonly readFile: (path: string) => Effect.Effect<Uint8Array, FileIOError>
  readonly writeFile: (path: string, data: Uint8Array) => Effect.Effect<void, FileIOError>
  readonly readDirectory: (path: string) => Effect.Effect<readonly string[], FileIOError>
  readonly makeDirectory: (
    path: string,
    options?: { recursive?: boolean },
  ) => Effect.Effect<void, FileIOError>
  readonly ensureDir: (path: string) => Effect.Effect<void, FileIOError>
  readonly remove: (
    path: string,
    options?: { recursive?: boolean, force?: boolean },
  ) => Effect.Effect<void, FileIOError>
  readonly copyFile: (src: string, dest: string) => Effect.Effect<void, FileIOError>
}

class FsServiceTag extends Context.Tag('Fs')<FsServiceTag, FsService>() {}

export const FsLive = Layer.effect(
  FsServiceTag,
  Effect.gen(function* () {
    const platformFs = yield* FileSystem.FileSystem

    const mapErr = (
      op: FileIOError['op'],
      path: string,
    ) => (e: unknown) =>
      new FileIOError({
        op,
        path,
        message: `${op} failed: \n path: ${path} \n ${String(e)}`,
      })

    const exists: FsService['exists'] = path =>
      pipe(
        platformFs.exists(path),
        Effect.mapError(mapErr('exists', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const readFileString: FsService['readFileString'] = path =>
      pipe(
        platformFs.readFileString(path),
        Effect.mapError(mapErr('read', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const writeFileString: FsService['writeFileString'] = (path, content) =>
      pipe(
        platformFs.writeFileString(path, content),
        Effect.mapError(mapErr('write', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const readFile: FsService['readFile'] = path =>
      pipe(
        platformFs.readFile(path),
        Effect.mapError(mapErr('read', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const writeFile: FsService['writeFile'] = (path, data) =>
      pipe(
        platformFs.writeFile(path, data),
        Effect.mapError(mapErr('write', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const readDirectory: FsService['readDirectory'] = path =>
      pipe(
        platformFs.readDirectory(path),
        Effect.mapError(mapErr('read', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const makeDirectory: FsService['makeDirectory'] = (path, options) =>
      pipe(
        platformFs.makeDirectory(path, options),
        Effect.mapError(mapErr('mkdir', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const ensureDir: FsService['ensureDir'] = path =>
      makeDirectory(path, { recursive: true })

    const remove: FsService['remove'] = (path, options) =>
      pipe(
        platformFs.remove(path, options),
        Effect.mapError(mapErr('remove', path)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    const copyFile: FsService['copyFile'] = (src, dest) =>
      pipe(
        platformFs.copyFile(src, dest),
        Effect.mapError(mapErr('write', dest)),
        Effect.provideService(FileSystem.FileSystem, platformFs),
      )

    return FsServiceTag.of({ exists, readFileString, writeFileString, readFile, writeFile, readDirectory, makeDirectory, ensureDir, remove, copyFile })
  }),
)

export { FsServiceTag as FsService }
