import { Injectable, NotFoundException, BadRequestException, Inject, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BannerStatus, HomepageBanner, Prisma } from '../../generated/prisma';
import {
  CreateBannerDto,
  UpdateBannerDto,
  ReorderBannersDto,
  QueryBannersDto,
} from './dto/banner.dto';

export type EffectiveBannerStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DRAFT' | 'ARCHIVED';

export interface BannerWithEffectiveStatus extends HomepageBanner {
  effectiveStatus: EffectiveBannerStatus;
  isCurrentlyActive: boolean;
  createdBy?: { id: string; name: string; email: string } | null;
  updatedBy?: { id: string; name: string; email: string } | null;
}

@Injectable()
export class BannersService implements OnModuleInit {
  private hasCheckedDefaults = false;

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) { }

  async onModuleInit() {
    await this.seedDefaultBannersIfMissing();
  }

  public async seedDefaultBannersIfMissing(): Promise<void> {
    if (this.hasCheckedDefaults) return;
    try {
      const defaults = [
        {
          title: 'Speed Ball Pen (Write Beyond Limits)',
          subtitle: 'DISTRIBUTOR SPOTLIGHT',
          description: 'High-performance writing instruments engineered for ultra-smooth gliding, zero-smudge ink delivery, and prolonged exam endurance.',
          desktopImage: '/images/hero/test-output/desktop_1920x1080.png',
          mobileImage: null,
          imageAltText: 'Speed Ball Pen Series - Write Beyond Limits',
          buttonText: 'Explore Speed Range',
          buttonLink: '/shop?brand=Speed',
          placement: 'HERO',
          sortOrder: 1,
          status: BannerStatus.PUBLISHED,
        },
        {
          title: 'Supplies Without Limits',
          subtitle: 'OFFICIAL STATIONERY DISTRIBUTOR',
          description: 'Everything you need for classrooms and corporate workspaces with authentic direct-distributor guarantees.',
          desktopImage: '/images/hero/supplies_without_limits_full.png',
          mobileImage: null,
          imageAltText: 'DSL Stationery school essentials and distribution catalogue',
          buttonText: 'Shop Catalogue',
          buttonLink: '/shop',
          placement: 'HERO',
          sortOrder: 2,
          status: BannerStatus.PUBLISHED,
        },
        {
          title: 'Find Your School Pack',
          subtitle: 'GRADE-WISE PACKS & BOOKLISTS',
          description: 'Curated stationery packages pre-approved by leading schools with fast home delivery and official booklist matching.',
          desktopImage: '/images/hero/school_pack_full.png',
          mobileImage: null,
          imageAltText: 'Grade-wise school packs and stationery packages',
          buttonText: 'Explore School Packs',
          buttonLink: '/school-packs',
          placement: 'HERO',
          sortOrder: 3,
          status: BannerStatus.PUBLISHED,
        },
      ];

      for (const item of defaults) {
        const existing = await this.prisma.homepageBanner.findFirst({
          where: { title: item.title },
        });
        if (!existing) {
          await this.prisma.homepageBanner.create({
            data: item,
          });
        }
      }
      this.hasCheckedDefaults = true;
    } catch (err) {
      console.warn('Failed to seed default banners:', err);
    }
  }

  /**
   * Pure calculation of banner's effective status on read.
   * Avoids fragile cron jobs and reflects the real runtime state.
   */
  public calculateEffectiveStatus(
    banner: Pick<HomepageBanner, 'status' | 'startAt' | 'endAt'>,
    now: Date = new Date()
  ): { effectiveStatus: EffectiveBannerStatus; isCurrentlyActive: boolean } {
    if (banner.status === BannerStatus.ARCHIVED) {
      return { effectiveStatus: 'ARCHIVED', isCurrentlyActive: false };
    }
    if (banner.status === BannerStatus.DRAFT) {
      return { effectiveStatus: 'DRAFT', isCurrentlyActive: false };
    }

    const nowTime = now.getTime();
    const startTime = banner.startAt ? new Date(banner.startAt).getTime() : null;
    const endTime = banner.endAt ? new Date(banner.endAt).getTime() : null;

    if (endTime !== null && nowTime >= endTime) {
      return { effectiveStatus: 'EXPIRED', isCurrentlyActive: false };
    }

    if (startTime !== null && nowTime < startTime) {
      return { effectiveStatus: 'SCHEDULED', isCurrentlyActive: false };
    }

    // At this point, banner is either PUBLISHED (with valid window) or SCHEDULED (window has started)
    return { effectiveStatus: 'ACTIVE', isCurrentlyActive: true };
  }

  /**
   * Public: Fetch all active homepage banners ordered by sortOrder ASC, createdAt DESC.
   */
  public async getHomepageBanners(
    placement?: string,
    now: Date = new Date()
  ): Promise<BannerWithEffectiveStatus[]> {
    await this.seedDefaultBannersIfMissing();
    const where: any = {
      status: {
        in: [BannerStatus.PUBLISHED, BannerStatus.SCHEDULED],
      },
      ...(placement === 'HERO'
        ? {
            OR: [{ placement: 'HERO' }, { placement: null }],
          }
        : placement
          ? { placement }
          : {}),
      AND: [
        {
          OR: [
            { startAt: null },
            { startAt: { lte: now } },
          ],
        },
        {
          OR: [
            { endAt: null },
            { endAt: { gt: now } },
          ],
        },
      ],
    };

    const banners = await this.prisma.homepageBanner.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return banners.map((b) => ({
      ...b,
      ...this.calculateEffectiveStatus(b, now),
    }));
  }

  /**
   * Admin: Fetch all banners matching query with effective status and user info.
   */
  public async getAdminBanners(
    query?: QueryBannersDto,
    now: Date = new Date()
  ): Promise<BannerWithEffectiveStatus[]> {
    await this.seedDefaultBannersIfMissing();
    const where: any = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.placement) {
      where.placement = query.placement;
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { subtitle: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { buttonText: { contains: term, mode: 'insensitive' } },
      ];
    }

    const banners = await this.prisma.homepageBanner.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return banners.map((b) => ({
      ...b,
      ...this.calculateEffectiveStatus(b, now),
    }));
  }

  /**
   * Admin: Fetch a single banner by ID.
   */
  public async getBannerById(id: string, now: Date = new Date()): Promise<BannerWithEffectiveStatus> {
    const banner = await this.prisma.homepageBanner.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!banner) {
      throw new NotFoundException(`Banner with ID "${id}" was not found`);
    }

    return {
      ...banner,
      ...this.calculateEffectiveStatus(banner, now),
    };
  }

  /**
   * Admin: Create a new banner.
   */
  public async createBanner(
    dto: CreateBannerDto,
    userId?: string
  ): Promise<BannerWithEffectiveStatus> {
    // If sortOrder was not explicitly given, place at the end of the order
    let sortOrder = dto.sortOrder ?? 0;
    if (dto.sortOrder === undefined) {
      const maxOrder = await this.prisma.homepageBanner.aggregate({
        _max: { sortOrder: true },
      });
      sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    }

    const data: any = {
      title: dto.title,
      subtitle: dto.subtitle ?? null,
      description: dto.description ?? null,
      desktopImage: dto.desktopImage,
      mobileImage: dto.mobileImage ?? null,
      imageAltText: dto.imageAltText,
      buttonText: dto.buttonText ?? null,
      buttonLink: dto.buttonLink ?? null,
      placement: dto.placement ?? 'HERO',
      sortOrder,
      status: dto.status ?? BannerStatus.DRAFT,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
      createdById: userId ?? null,
      updatedById: userId ?? null,
    };

    const banner = await this.prisma.homepageBanner.create({
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      ...banner,
      ...this.calculateEffectiveStatus(banner),
    };
  }

  /**
   * Admin: Update an existing banner.
   */
  public async updateBanner(
    id: string,
    dto: UpdateBannerDto,
    userId?: string
  ): Promise<BannerWithEffectiveStatus> {
    const existing = await this.prisma.homepageBanner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Banner with ID "${id}" was not found`);
    }

    const data: any = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.desktopImage !== undefined ? { desktopImage: dto.desktopImage } : {}),
      ...(dto.mobileImage !== undefined ? { mobileImage: dto.mobileImage } : {}),
      ...(dto.imageAltText !== undefined ? { imageAltText: dto.imageAltText } : {}),
      ...(dto.buttonText !== undefined ? { buttonText: dto.buttonText } : {}),
      ...(dto.buttonLink !== undefined ? { buttonLink: dto.buttonLink } : {}),
      ...(dto.placement !== undefined ? { placement: dto.placement ?? 'HERO' } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.startAt !== undefined ? { startAt: dto.startAt ? new Date(dto.startAt) : null } : {}),
      ...(dto.endAt !== undefined ? { endAt: dto.endAt ? new Date(dto.endAt) : null } : {}),
      ...(userId ? { updatedBy: { connect: { id: userId } } } : {}),
    };

    const updated = await this.prisma.homepageBanner.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      ...updated,
      ...this.calculateEffectiveStatus(updated),
    };
  }

  /**
   * Admin: Delete a banner by ID.
   */
  public async deleteBanner(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.homepageBanner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Banner with ID "${id}" was not found`);
    }

    await this.prisma.homepageBanner.delete({ where: { id } });
    return { success: true, message: `Banner "${existing.title}" deleted successfully` };
  }

  /**
   * Admin: Duplicate a banner.
   */
  public async duplicateBanner(id: string, userId?: string): Promise<BannerWithEffectiveStatus> {
    const original = await this.prisma.homepageBanner.findUnique({ where: { id } });
    if (!original) {
      throw new NotFoundException(`Banner with ID "${id}" was not found`);
    }

    const maxOrder = await this.prisma.homepageBanner.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxOrder._max.sortOrder ?? original.sortOrder) + 1;

    const duplicate = await this.prisma.homepageBanner.create({
      data: {
        title: `${original.title} (Copy)`,
        subtitle: original.subtitle,
        description: original.description,
        desktopImage: original.desktopImage,
        mobileImage: original.mobileImage,
        imageAltText: original.imageAltText,
        buttonText: original.buttonText,
        buttonLink: original.buttonLink,
        sortOrder: nextSortOrder,
        status: BannerStatus.DRAFT,
        startAt: null,
        endAt: null,
        createdById: userId ?? null,
        updatedById: userId ?? null,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      ...duplicate,
      ...this.calculateEffectiveStatus(duplicate),
    };
  }

  /**
   * Admin: Reorder banners in bulk.
   */
  public async reorderBanners(dto: ReorderBannersDto): Promise<{ success: boolean; message: string }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No items provided for reordering');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.homepageBanner.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return { success: true, message: 'Banners reordered successfully' };
  }
}
