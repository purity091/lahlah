// =============================================================================
// هياكل JSON القياسية لجميع أنواع وثائق إدارة المنتجات الرقمية
// RDP - Requirements Documentation Protocol
// =============================================================================

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 1. مرحلة الاكتشاف (Discovery Phase)                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * وثيقة رؤية المنتج (Product Vision Document)
 * الهدف: توحيد الفهم العام حول سبب وجود المنتج والقيمة التي يقدمها
 * متى تُستخدم: في بداية تأسيس المنتج أو عند إعادة تعريف اتجاهه
 */
export interface VisionDocument {
    // معلومات الوثيقة
    metadata: {
        documentId: string;
        projectId: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved' | 'deprecated';
        createdAt: number;
        updatedAt: number | null;
        author: string;
        reviewers: string[];
    };

    // الرؤية الأساسية
    vision: {
        statement: string;              // بيان الرؤية (جملة واحدة قوية)
        timeHorizon: string;            // الأفق الزمني (مثلاً: 3-5 سنوات)
        inspiredBy: string | null;      // مصدر الإلهام
    };

    // المشكلة العامة في السوق
    marketProblem: {
        description: string;            // وصف المشكلة في السوق
        scope: 'global' | 'regional' | 'local' | 'niche';
        affectedSegments: string[];     // الفئات المتأثرة
        currentSolutions: string[];     // الحلول الحالية في السوق
        gaps: string[];                 // الثغرات في الحلول الحالية
    };

    // المستخدمون المستهدفون
    targetAudience: {
        primaryUsers: {
            segment: string;
            description: string;
            size: string | null;          // حجم الشريحة (تقديري)
        }[];
        secondaryUsers: {
            segment: string;
            description: string;
        }[];
        excludedUsers: string[];        // من لا نستهدفهم صراحةً
    };

    // القيمة المقدمة
    valueProposition: {
        coreValue: string;              // القيمة الأساسية (جملة واحدة)
        benefits: {
            benefit: string;
            forWhom: string;
        }[];
        differentiators: string[];      // ما يميزنا عن المنافسين
    };

    // ما ليس ضمن المنتج
    outOfScope: {
        excluded: string[];             // ما لن نقدمه
        reasons: string[];              // لماذا
        futureConsideration: string[];  // قد يُضاف مستقبلاً
    };

    // مقاييس النجاح على مستوى الرؤية
    successIndicators: {
        qualitative: string[];          // مؤشرات نوعية
        quantitative: {
            metric: string;
            target: string;
            timeframe: string;
        }[];
    };
}

/**
 * وثيقة بيان المشكلة (Problem Statement Document)
 * الهدف: توصيف المشكلة بدقة دون القفز للحلول
 * متى تُستخدم: قبل البدء في تصميم أي ميزة أو منتج
 */
export interface ProblemStatementDocument {
    metadata: {
        documentId: string;
        projectId: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved' | 'deprecated';
        createdAt: number;
        updatedAt: number | null;
        author: string;
    };

    // سياق المستخدم
    userContext: {
        persona: string;                // اسم الشخصية المستهدفة
        currentJourney: string;         // رحلة المستخدم الحالية
        environment: string;            // بيئة الاستخدام
        frequency: string;              // تكرار المواجهة للمشكلة
        triggers: string[];             // ما يُحفز ظهور المشكلة
    };

    // نقاط الألم
    painPoints: {
        pain: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        frequency: 'always' | 'often' | 'sometimes' | 'rarely';
        workaround: string | null;      // كيف يتعامل معها حالياً
    }[];

    // الأدلة والبيانات
    evidence: {
        type: 'interview' | 'survey' | 'analytics' | 'support_tickets' | 'observation' | 'research';
        source: string;
        finding: string;
        sampleSize: number | null;
        date: string;
    }[];

    // الأثر
    impact: {
        onUser: {
            description: string;
            metrics: string[];            // مقاييس التأثير على المستخدم
        };
        onBusiness: {
            description: string;
            estimatedCost: string | null; // التكلفة التقديرية
            metrics: string[];
        };
        emotional: string[];            // الأثر العاطفي على المستخدم
    };

    // الحالة الحالية vs المرغوبة
    stateComparison: {
        currentState: string;           // كيف تُنجز المهمة حالياً
        desiredState: string;           // الحالة المثالية
        obstacles: string[];            // العوائق للوصول للحالة المرغوبة
    };

    // ملخص بيان المشكلة
    problemSummary: {
        statement: string;              // بيان المشكلة المختصر
        hypothesis: string;             // الفرضية المقترحة للحل
    };
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 2. مرحلة الاستراتيجية (Strategy Phase)                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * وثيقة استراتيجية المنتج (Product Strategy Document)
 * الهدف: تحويل الرؤية إلى توجهات استراتيجية قابلة للتنفيذ
 * متى تُستخدم: بعد تحديد الرؤية وقبل بناء خارطة الطريق
 */
export interface ProductStrategyDocument {
    metadata: {
        documentId: string;
        projectId: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved' | 'deprecated';
        createdAt: number;
        updatedAt: number | null;
        author: string;
        stakeholders: string[];
    };

    // الركائز الاستراتيجية
    strategicPillars: {
        pillar: string;
        description: string;
        rationale: string;              // لماذا هذه الركيزة مهمة
        initiatives: string[];          // المبادرات المرتبطة
    }[];

    // التموضع في السوق
    marketPositioning: {
        targetMarket: string;
        marketSize: string | null;
        positioning: string;            // كيف نريد أن يُنظر إلينا
        competitors: {
            name: string;
            strengths: string[];
            weaknesses: string[];
            ourAdvantage: string;
        }[];
    };

    // عناصر التميز
    differentiators: {
        element: string;
        description: string;
        sustainabilityLevel: 'high' | 'medium' | 'low'; // مدى استدامة الميزة التنافسية
        defensibility: string;          // كيف ندافع عن هذا التميز
    }[];

    // التضحيات والاختيارات (Trade-offs)
    tradeoffs: {
        choice: string;                 // ما اخترناه
        alternative: string;            // البديل الذي رفضناه
        reason: string;                 // سبب الاختيار
        implications: string[];         // التبعات
    }[];

    // نموذج العمل
    businessModel: {
        revenueStreams: string[];
        costStructure: string[];
        keyResources: string[];
        keyPartners: string[];
        channels: string[];
    };

    // الأهداف الاستراتيجية
    strategicGoals: {
        goal: string;
        keyResults: {
            result: string;
            metric: string;
            target: string;
            timeline: string;
        }[];
        priority: 'critical' | 'high' | 'medium' | 'low';
    }[];
}

/**
 * وثيقة خارطة الطريق (Product Roadmap Document)
 * الهدف: التسلسل المنطقي لتطوير المنتج مع الأهداف والمخرجات
 * متى تُستخدم: للتخطيط ربع السنوي أو السنوي
 */
export interface RoadmapDocument {
    metadata: {
        documentId: string;
        projectId: string;
        version: string;
        horizon: 'quarterly' | 'semi-annual' | 'annual';
        status: 'draft' | 'active' | 'archived';
        createdAt: number;
        updatedAt: number | null;
        owner: string;
    };

    // المحاور الرئيسية
    themes: {
        id: string;
        name: string;
        description: string;
        strategicGoal: string;          // الهدف الاستراتيجي المرتبط
        priority: number;               // 1 = الأعلى أولوية
        color: string;                  // للعرض المرئي
    }[];

    // الإصدارات والمراحل
    releases: {
        id: string;
        name: string;
        targetDate: string;
        status: 'planned' | 'in_progress' | 'completed' | 'delayed';
        theme: string;                  // معرف المحور
        outcomes: string[];             // النتائج المتوقعة
        features: {
            id: string;
            name: string;
            effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
            confidence: 'high' | 'medium' | 'low';
            status: 'planned' | 'in_progress' | 'done' | 'cut';
        }[];
        dependencies: string[];         // معرفات الإصدارات المعتمد عليها
        risks: string[];
    }[];

    // المقاييس والنتائج
    successMetrics: {
        metric: string;
        baseline: string;
        target: string;
        measurementMethod: string;
    }[];

    // الافتراضات والمخاطر
    assumptions: string[];
    risks: {
        risk: string;
        likelihood: 'high' | 'medium' | 'low';
        impact: 'high' | 'medium' | 'low';
        mitigation: string;
    }[];
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 3. مرحلة التعريف (Definition Phase)                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * وثيقة متطلبات المنتج (PRD - Product Requirements Document)
 * الهدف: تحويل المشكلة إلى متطلبات قابلة للتنفيذ
 * متى تُستخدم: قبل بدء التطوير لأي ميزة
 */
export interface PRDDocument {
    metadata: {
        documentId: string;
        projectId: string;
        featureId: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved' | 'in_development' | 'shipped';
        createdAt: number;
        updatedAt: number | null;
        author: string;
        reviewers: string[];
        approvers: string[];
    };

    // الخلفية والسياق
    background: {
        problemReference: string;       // رابط لوثيقة بيان المشكلة
        context: string;                // السياق الذي أدى لهذه الميزة
        strategicAlignment: string;     // كيف تتوافق مع الاستراتيجية
        businessCase: string;           // التبرير التجاري
    };

    // الأهداف
    goals: {
        primary: string;
        secondary: string[];
        nonGoals: string[];             // ما ليس هدفاً لهذه الميزة
    };

    // قصص المستخدم
    userStories: {
        id: string;
        asA: string;                    // كـ [نوع المستخدم]
        iWant: string;                  // أريد [الفعل]
        soThat: string;                 // لكي [الفائدة]
        priority: 'must' | 'should' | 'could' | 'wont';
        acceptanceCriteria: string[];
    }[];

    // المتطلبات الوظيفية
    functionalRequirements: {
        id: string;
        requirement: string;
        priority: 'must' | 'should' | 'could';
        userStoryRef: string[];         // معرفات قصص المستخدم المرتبطة
        notes: string | null;
    }[];

    // المتطلبات غير الوظيفية
    nonFunctionalRequirements: {
        category: 'performance' | 'security' | 'scalability' | 'accessibility' | 'usability' | 'reliability';
        requirement: string;
        metric: string;
        target: string;
    }[];

    // مؤشرات النجاح
    successMetrics: {
        metric: string;
        baseline: string | null;
        target: string;
        measurementMethod: string;
        timeframe: string;
    }[];

    // النطاق
    scope: {
        inScope: string[];
        outOfScope: string[];
        futureConsiderations: string[];
    };

    // الاعتماديات والقيود
    dependencies: {
        type: 'internal' | 'external' | 'technical';
        description: string;
        owner: string;
        status: 'resolved' | 'pending' | 'blocked';
    }[];

    constraints: {
        type: 'technical' | 'business' | 'legal' | 'time' | 'resource';
        description: string;
        impact: string;
    }[];

    // الجدول الزمني
    timeline: {
        estimatedEffort: string;
        targetStartDate: string | null;
        targetEndDate: string | null;
        milestones: {
            name: string;
            date: string;
            deliverables: string[];
        }[];
    };
}

/**
 * وثيقة مواصفات الميزة (Feature Specification)
 * الهدف: تفصيل كيفية عمل الميزة
 * متى تُستخدم: بعد الـ PRD وقبل التطوير التقني
 */
export interface FeatureSpecDocument {
    metadata: {
        documentId: string;
        projectId: string;
        prdReference: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved';
        createdAt: number;
        updatedAt: number | null;
        author: string;
    };

    // حالات التشغيل
    useCases: {
        id: string;
        name: string;
        actor: string;
        preconditions: string[];
        mainFlow: {
            step: number;
            action: string;
            systemResponse: string;
        }[];
        alternativeFlows: {
            condition: string;
            steps: string[];
        }[];
        postconditions: string[];
    }[];

    // الصلاحيات والوصول
    permissions: {
        role: string;
        canView: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
        specialPermissions: string[];
    }[];

    // تدفق البيانات
    dataFlow: {
        inputs: {
            field: string;
            type: string;
            required: boolean;
            validation: string;
            source: string;
        }[];
        outputs: {
            field: string;
            type: string;
            destination: string;
        }[];
        transformations: string[];
    };

    // معالجة الأخطاء
    errorHandling: {
        errorCase: string;
        userMessage: string;
        systemAction: string;
        recoveryOption: string | null;
    }[];

    // الحالات الحدية
    edgeCases: {
        scenario: string;
        expectedBehavior: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
    }[];

    // التكامل مع الميزات الأخرى
    integrations: {
        feature: string;
        type: 'depends_on' | 'triggers' | 'shares_data';
        description: string;
    }[];
}

/**
 * وثيقة مواصفات تجربة المستخدم (UX Specification)
 * الهدف: ضمان تجربة واضحة ومتسقة
 * متى تُستخدم: مع مواصفات الميزة
 */
export interface UXSpecDocument {
    metadata: {
        documentId: string;
        projectId: string;
        featureRef: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved';
        createdAt: number;
        updatedAt: number | null;
        designer: string;
    };

    // مسارات المستخدم
    userFlows: {
        id: string;
        name: string;
        startPoint: string;
        endPoint: string;
        steps: {
            screen: string;
            action: string;
            nextScreen: string;
        }[];
        figmaLink: string | null;
    }[];

    // الرسومات التخطيطية
    wireframes: {
        screenId: string;
        name: string;
        description: string;
        figmaLink: string | null;
        components: string[];
        interactions: string[];
    }[];

    // الحالات المختلفة للواجهة
    uiStates: {
        screen: string;
        states: {
            state: 'default' | 'loading' | 'empty' | 'error' | 'success' | 'partial';
            description: string;
            content: string;
            actions: string[];
        }[];
    }[];

    // النصوص والمحتوى
    microcopy: {
        location: string;
        type: 'label' | 'placeholder' | 'error' | 'success' | 'helper' | 'button' | 'title';
        textAr: string;
        textEn: string | null;
        tone: string;
        notes: string | null;
    }[];

    // معايير الوصول
    accessibility: {
        requirement: string;
        implementation: string;
        wcagLevel: 'A' | 'AA' | 'AAA';
    }[];

    // التجاوب
    responsiveness: {
        breakpoint: 'mobile' | 'tablet' | 'desktop';
        layoutChanges: string[];
        hiddenElements: string[];
    }[];
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 4. مرحلة التنفيذ (Execution Phase)                                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * وثيقة المواصفات التقنية (Technical Specification)
 * الهدف: البنية التقنية ونماذج البيانات
 * متى تُستخدم: قبل بدء التطوير البرمجي
 */
export interface TechSpecDocument {
    metadata: {
        documentId: string;
        projectId: string;
        featureRef: string;
        version: string;
        status: 'draft' | 'in_review' | 'approved' | 'implemented';
        createdAt: number;
        updatedAt: number | null;
        author: string;
        techLead: string;
    };

    // البنية العامة
    architecture: {
        overview: string;
        diagram: string | null;         // رابط للرسم البياني
        components: {
            name: string;
            responsibility: string;
            technology: string;
            interactions: string[];
        }[];
        patterns: string[];             // الأنماط المستخدمة
    };

    // نماذج البيانات
    dataModels: {
        entity: string;
        description: string;
        fields: {
            name: string;
            type: string;
            required: boolean;
            constraints: string[];
            description: string;
        }[];
        relationships: {
            target: string;
            type: 'one-to-one' | 'one-to-many' | 'many-to-many';
            description: string;
        }[];
        indexes: string[];
    }[];

    // واجهات برمجة التطبيقات
    apis: {
        endpoint: string;
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        description: string;
        requestBody: object | null;
        responseBody: object;
        errorCodes: {
            code: number;
            message: string;
            scenario: string;
        }[];
        authentication: string;
        rateLimit: string | null;
    }[];

    // التكاملات الخارجية
    externalIntegrations: {
        service: string;
        purpose: string;
        protocol: string;
        authentication: string;
        dataExchanged: string[];
        errorHandling: string;
    }[];

    // القيود التقنية
    technicalConstraints: {
        constraint: string;
        reason: string;
        workaround: string | null;
    }[];

    // الأداء والتوسع
    performanceRequirements: {
        metric: string;
        target: string;
        measurement: string;
    }[];

    // الأمان
    securityConsiderations: {
        aspect: string;
        requirement: string;
        implementation: string;
    }[];

    // خطة الاختبار
    testingStrategy: {
        type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
        coverage: string;
        tools: string[];
        criticalPaths: string[];
    }[];
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 5. مرحلة الإطلاق (Launch Phase)                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * وثيقة الإطلاق (Launch Document)
 * الهدف: تنظيم إطلاق الميزة أو المنتج
 * متى تُستخدم: قبل الإطلاق بأسابيع
 */
export interface LaunchDocument {
    metadata: {
        documentId: string;
        projectId: string;
        featureRef: string;
        launchDate: string;
        status: 'planning' | 'ready' | 'launched' | 'rolled_back';
        createdAt: number;
        updatedAt: number | null;
        launchLead: string;
    };

    // الجمهور المستهدف للإطلاق
    targetAudience: {
        segment: string;
        size: string;
        rolloutPercentage: number;
        criteria: string[];
    }[];

    // خطة الطرح
    rolloutPlan: {
        phase: string;
        audience: string;
        percentage: number;
        startDate: string;
        duration: string;
        successCriteria: string[];
        rollbackTriggers: string[];
    }[];

    // الرسائل والتواصل
    messaging: {
        channel: string;
        audience: string;
        message: string;
        timing: string;
        owner: string;
    }[];

    // القائمة التحققية قبل الإطلاق
    prelaunchChecklist: {
        category: 'technical' | 'marketing' | 'support' | 'legal' | 'operations';
        item: string;
        status: 'done' | 'in_progress' | 'not_started' | 'blocked';
        owner: string;
        notes: string | null;
    }[];

    // المخاطر وخطة الطوارئ
    risks: {
        risk: string;
        likelihood: 'high' | 'medium' | 'low';
        impact: 'high' | 'medium' | 'low';
        mitigation: string;
        contingency: string;
        owner: string;
    }[];

    // مقاييس ما بعد الإطلاق
    postLaunchMetrics: {
        metric: string;
        baseline: string;
        target: string;
        actualDay1: string | null;
        actualWeek1: string | null;
        actualMonth1: string | null;
    }[];

    // خطة التراجع
    rollbackPlan: {
        trigger: string;
        steps: string[];
        estimatedTime: string;
        notificationPlan: string;
    };
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 6. مرحلة النمو (Growth Phase)                                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * وثيقة التجارب (Experiment Document)
 * الهدف: توثيق التجارب والنتائج
 * متى تُستخدم: لكل تجربة A/B أو تحسين
 */
export interface ExperimentDocument {
    metadata: {
        documentId: string;
        projectId: string;
        experimentId: string;
        status: 'hypothesis' | 'designing' | 'running' | 'analyzing' | 'concluded';
        createdAt: number;
        updatedAt: number | null;
        owner: string;
    };

    // الفرضية
    hypothesis: {
        statement: string;              // نعتقد أن... سيؤدي إلى...
        assumption: string;             // الافتراض الأساسي
        riskIfWrong: string;            // المخاطر إذا كانت الفرضية خاطئة
    };

    // تصميم التجربة
    design: {
        type: 'A/B' | 'multivariate' | 'feature_flag' | 'holdout';
        variants: {
            name: string;
            description: string;
            trafficPercentage: number;
        }[];
        sampleSize: number;
        duration: string;
        targetAudience: string;
        exclusions: string[];
    };

    // المقاييس
    metrics: {
        primary: {
            metric: string;
            minimumDetectableEffect: string;
            baseline: string;
        };
        secondary: {
            metric: string;
            expectedChange: string;
        }[];
        guardrails: {
            metric: string;
            threshold: string;
        }[];
    };

    // النتائج
    results: {
        startDate: string | null;
        endDate: string | null;
        sampleSizeReached: number | null;
        variantResults: {
            variant: string;
            primaryMetric: string;
            confidence: string;
            significanceLevel: string;
        }[];
        statisticalSignificance: boolean | null;
        winningVariant: string | null;
    };

    // القرار
    decision: {
        outcome: 'ship' | 'iterate' | 'kill' | 'pending';
        rationale: string;
        learnings: string[];
        nextSteps: string[];
    };
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 7. مرحلة التوسع (Scale Phase)                                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * كتيب المنتج (Product Manual)
 * الهدف: دليل التشغيل والتوسع
 * متى تُستخدم: للفريق الداخلي والتأهيل
 */
export interface ProductManualDocument {
    metadata: {
        documentId: string;
        projectId: string;
        version: string;
        lastUpdated: number;
        maintainer: string;
    };

    // نظرة عامة
    overview: {
        productName: string;
        description: string;
        targetUsers: string[];
        keyFeatures: string[];
    };

    // أدلة الميزات
    featureGuides: {
        featureName: string;
        description: string;
        howToUse: string[];
        tips: string[];
        commonIssues: {
            issue: string;
            solution: string;
        }[];
    }[];

    // إجراءات التشغيل
    operationalProcedures: {
        procedure: string;
        frequency: string;
        steps: string[];
        owner: string;
    }[];

    // الأسئلة الشائعة
    faq: {
        question: string;
        answer: string;
        category: string;
    }[];

    // مسار التصعيد
    escalationPath: {
        level: number;
        contact: string;
        scenarios: string[];
        responseTime: string;
    }[];
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ 8. مرحلة الحوكمة (Governance Phase)                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * سجل القرارات (Decision Log)
 * الهدف: توثيق أسباب القرارات المهمة
 * متى تُستخدم: لكل قرار استراتيجي أو تقني مهم
 */
export interface DecisionLogDocument {
    metadata: {
        documentId: string;
        projectId: string;
        decisionId: string;
        status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
        createdAt: number;
        decidedAt: number | null;
        author: string;
        deciders: string[];
    };

    // القرار
    decision: {
        title: string;
        summary: string;
        context: string;                // السياق الذي أدى للقرار
        scope: string;                  // نطاق تأثير القرار
    };

    // الخيارات المدروسة
    options: {
        option: string;
        description: string;
        pros: string[];
        cons: string[];
        effort: 'low' | 'medium' | 'high';
        risk: 'low' | 'medium' | 'high';
        chosen: boolean;
    }[];

    // التبرير
    rationale: {
        whyChosen: string;
        whyNotOthers: string;
        assumptions: string[];
        constraints: string[];
    };

    // التبعات
    consequences: {
        positive: string[];
        negative: string[];
        risks: string[];
        mitigations: string[];
    };

    // المتابعة
    followUp: {
        action: string;
        owner: string;
        dueDate: string;
        status: 'pending' | 'done';
    }[];

    // المراجعة
    reviewSchedule: {
        nextReviewDate: string | null;
        reviewCriteria: string[];
    };
}

// =============================================================================
// دوال مساعدة لإنشاء وثائق فارغة
// =============================================================================

export function createEmptyVisionDocument(projectId: string): VisionDocument {
    return {
        metadata: {
            documentId: crypto.randomUUID(),
            projectId,
            version: '1.0.0',
            status: 'draft',
            createdAt: Date.now(),
            updatedAt: null,
            author: '',
            reviewers: []
        },
        vision: { statement: '', timeHorizon: '', inspiredBy: null },
        marketProblem: { description: '', scope: 'regional', affectedSegments: [], currentSolutions: [], gaps: [] },
        targetAudience: { primaryUsers: [], secondaryUsers: [], excludedUsers: [] },
        valueProposition: { coreValue: '', benefits: [], differentiators: [] },
        outOfScope: { excluded: [], reasons: [], futureConsideration: [] },
        successIndicators: { qualitative: [], quantitative: [] }
    };
}

export function createEmptyPRDDocument(projectId: string): PRDDocument {
    return {
        metadata: {
            documentId: crypto.randomUUID(),
            projectId,
            featureId: crypto.randomUUID(),
            version: '1.0.0',
            status: 'draft',
            createdAt: Date.now(),
            updatedAt: null,
            author: '',
            reviewers: [],
            approvers: []
        },
        background: { problemReference: '', context: '', strategicAlignment: '', businessCase: '' },
        goals: { primary: '', secondary: [], nonGoals: [] },
        userStories: [],
        functionalRequirements: [],
        nonFunctionalRequirements: [],
        successMetrics: [],
        scope: { inScope: [], outOfScope: [], futureConsiderations: [] },
        dependencies: [],
        constraints: [],
        timeline: { estimatedEffort: '', targetStartDate: null, targetEndDate: null, milestones: [] }
    };
}

export function createEmptyExperimentDocument(projectId: string): ExperimentDocument {
    return {
        metadata: {
            documentId: crypto.randomUUID(),
            projectId,
            experimentId: crypto.randomUUID(),
            status: 'hypothesis',
            createdAt: Date.now(),
            updatedAt: null,
            owner: ''
        },
        hypothesis: { statement: '', assumption: '', riskIfWrong: '' },
        design: { type: 'A/B', variants: [], sampleSize: 0, duration: '', targetAudience: '', exclusions: [] },
        metrics: {
            primary: { metric: '', minimumDetectableEffect: '', baseline: '' },
            secondary: [],
            guardrails: []
        },
        results: {
            startDate: null, endDate: null, sampleSizeReached: null,
            variantResults: [], statisticalSignificance: null, winningVariant: null
        },
        decision: { outcome: 'pending', rationale: '', learnings: [], nextSteps: [] }
    };
}

export function createEmptyDecisionLogDocument(projectId: string): DecisionLogDocument {
    return {
        metadata: {
            documentId: crypto.randomUUID(),
            projectId,
            decisionId: crypto.randomUUID(),
            status: 'proposed',
            createdAt: Date.now(),
            decidedAt: null,
            author: '',
            deciders: []
        },
        decision: { title: '', summary: '', context: '', scope: '' },
        options: [],
        rationale: { whyChosen: '', whyNotOthers: '', assumptions: [], constraints: [] },
        consequences: { positive: [], negative: [], risks: [], mitigations: [] },
        followUp: [],
        reviewSchedule: { nextReviewDate: null, reviewCriteria: [] }
    };
}
