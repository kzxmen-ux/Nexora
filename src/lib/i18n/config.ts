export const SUPPORTED_LOCALES = ["ru", "kk"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE_NAME = "nexora_locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    SUPPORTED_LOCALES.includes(value as Locale)
  );
}

const translations: Record<Locale, Record<string, string>> = {
  ru: {
    "AI Manager": "ИИ-менеджер",
    "Authentication": "Аутентификация",
    "Sign in": "Войти",
    "Get started": "Начать",
    "Built around your existing systems": "Работает с вашими системами",
    "An AI manager, not another CRM.": "ИИ-менеджер, а не ещё одна CRM.",
    "Nexora is designed to work on top of the CRM a business already trusts, connecting customer conversations with operational data without replacing the source of truth.":
      "Nexora работает поверх CRM, которой бизнес уже доверяет: связывает диалоги с клиентами с операционными данными, не заменяя источник достоверной информации.",
    "Project foundation is ready": "Основа проекта готова",
    "Page not found": "Страница не найдена",
    "The requested page does not exist or you do not have access to it.":
      "Запрошенная страница не существует или у вас нет к ней доступа.",
    "Return to home": "Вернуться на главную",
    "Use your email and password to continue to Nexora.":
      "Введите электронную почту и пароль, чтобы продолжить работу в Nexora.",
    "New to Nexora?": "Впервые в Nexora?",
    "Create an account": "Создать аккаунт",
    "Welcome back": "С возвращением",
    "The authentication link is invalid or expired. Try again.":
      "Ссылка для аутентификации недействительна или истекла. Попробуйте ещё раз.",
    "Forgot your password?": "Забыли пароль?",
    "Create the account that will manage your Nexora access.":
      "Создайте аккаунт для управления доступом к Nexora.",
    "Already have an account?": "Уже есть аккаунт?",
    "Create your account": "Создание аккаунта",
    "Enter your email and we will send password reset instructions if the account exists.":
      "Введите электронную почту. Если аккаунт существует, мы отправим инструкции по сбросу пароля.",
    "Return to sign in": "Вернуться ко входу",
    "Reset your password": "Сброс пароля",
    "Choose a new password for your account.":
      "Придумайте новый пароль для аккаунта.",
    "Update password": "Обновить пароль",
    "Send reset link": "Отправить ссылку",
    "Create account": "Создать аккаунт",
    "Please wait…": "Подождите…",
    "Email": "Электронная почта",
    "New password": "Новый пароль",
    "Password": "Пароль",
    "Confirm password": "Подтвердите пароль",
    "Signing out…": "Выходим…",
    "Sign out": "Выйти",
    "Protected application": "Защищённое приложение",
    "Your password has been updated.": "Пароль успешно обновлён.",
    "Sign out could not be completed. Try again.":
      "Не удалось выйти. Попробуйте ещё раз.",
    "Organizations": "Организации",
    "Choose your organization": "Выберите организацию",
    "You are authenticated as": "Вы вошли как",
    "an authenticated user": "авторизованный пользователь",
    "You do not belong to an organization yet.":
      "Вы пока не состоите ни в одной организации.",
    "Create an organization": "Создать организацию",
    "You will become its owner automatically.":
      "Вы автоматически станете её владельцем.",
    "Organization name": "Название организации",
    "Slug": "Адрес организации",
    "Saving…": "Сохраняем…",
    "Create organization": "Создать организацию",
    "Save settings": "Сохранить настройки",
    "Overview": "Обзор",
    "Integrations": "Интеграции",
    "Administrators": "Администраторы",
    "← All organizations": "← Все организации",
    "Organization workspace": "Рабочее пространство организации",
    "owner": "владелец",
    "admin": "администратор",
    "Workspace overview": "Обзор рабочего пространства",
    "This page is loaded only after Supabase RLS and a server-side membership query authorize access.":
      "Эта страница загружается только после проверки доступа политиками Supabase RLS и серверным запросом членства.",
    "Organization settings": "Настройки организации",
    "Owners and admins may update operational organization fields.":
      "Владелец и администраторы могут изменять рабочие данные организации.",
    "Owner settings": "Настройки владельца",
    "Invite administrators with a one-time link and remove active administrators. Only organization owners can access this page.":
      "Приглашайте администраторов одноразовой ссылкой и удаляйте действующих администраторов. Страница доступна только владельцу организации.",
    "Administrator settings could not be loaded. Try again later.":
      "Не удалось загрузить настройки администраторов. Попробуйте позже.",
    "Invite an administrator": "Пригласить администратора",
    "The link expires after seven days. Nexora stores only its cryptographic hash, so copy it immediately.":
      "Ссылка действует семь дней. Nexora хранит только её криптографический хеш, поэтому скопируйте её сразу.",
    "Active administrators": "Действующие администраторы",
    "Added": "Добавлен",
    "No active administrators.": "Действующих администраторов нет.",
    "Invitation history": "История приглашений",
    "Expires": "Истекает",
    "Created": "Создано",
    "pending": "ожидает",
    "accepted": "принято",
    "expired": "истекло",
    "revoked": "отозвано",
    "No invitations have been created.": "Приглашений пока нет.",
    "Administrator email": "Электронная почта администратора",
    "One-time invitation link": "Одноразовая ссылка-приглашение",
    "Copied": "Скопировано",
    "Copy link": "Копировать ссылку",
    "Creating…": "Создаём…",
    "Create invitation": "Создать приглашение",
    "Working…": "Выполняем…",
    "Revoke": "Отозвать",
    "Remove": "Удалить",
    "Invitation unavailable": "Приглашение недоступно",
    "This invitation link is invalid. Ask the organization owner for a new link.":
      "Эта ссылка-приглашение недействительна. Попросите владельца организации создать новую.",
    "Administrator invitation": "Приглашение администратора",
    "Join an organization in Nexora": "Присоединиться к организации в Nexora",
    "Sign in or create an account with the exact email address that received this invitation.":
      "Войдите или создайте аккаунт с тем адресом электронной почты, на который пришло приглашение.",
    "Signed in as": "Вы вошли как",
    "The invitation can be accepted only if this email matches.":
      "Приглашение можно принять, только если адрес электронной почты совпадает.",
    "Accepting…": "Принимаем…",
    "Accept administrator invitation": "Принять приглашение администратора",
    "Connect Nexora to external systems without copying their operational data into this workspace.":
      "Подключайте Nexora к внешним системам без копирования их операционных данных в это рабочее пространство.",
    "Create and manage provider-neutral CRM connection metadata. A real CRM adapter has not been selected or implemented.":
      "Создавайте и настраивайте независимые от провайдера подключения CRM. Реальный CRM-адаптер пока не выбран и не реализован.",
    "CRM connections": "Подключения CRM",
    "Your CRM connections": "Ваши подключения CRM",
    "Manage the CRM connections available to this organization. The external CRM remains the source of truth.":
      "Управляйте подключениями CRM этой организации. Внешняя CRM остаётся источником достоверных данных.",
    "Provider:": "Провайдер:",
    "Edit": "Изменить",
    "No connections yet": "Подключений пока нет",
    "Choose the development connection below to prepare the integration boundary.":
      "Выберите подключение для разработки ниже, чтобы подготовить интеграционный слой.",
    "Connect a new CRM": "Подключить новую CRM",
    "Choose a provider. Production integrations will become available after their adapters are implemented and verified.":
      "Выберите провайдера. Рабочие интеграции станут доступны после реализации и проверки их адаптеров.",
    "Official integration": "Официальная интеграция",
    "Coming soon": "Скоро",
    "YCLIENTS integration is planned and cannot be connected yet.":
      "Интеграция YCLIENTS запланирована, но пока недоступна для подключения.",
    "Altegio integration is planned and cannot be connected yet.":
      "Интеграция Altegio запланирована, но пока недоступна для подключения.",
    "Configure": "Настроить",
    "Development only": "Только для разработки",
    "Development connection": "Подключение для разработки",
    "Create a non-secret test connection for developing the integration foundation.":
      "Создайте тестовое подключение без секретов для разработки интеграционного слоя.",
    "Development CRM connection": "CRM-подключение для разработки",
    "Create a non-secret development connection. This does not contact or connect to any real CRM provider.":
      "Создайте подключение для разработки без секретов. Оно не обращается к реальному провайдеру CRM и не подключается к нему.",
    "Workspace reference (optional)":
      "Идентификатор рабочего пространства (необязательно)",
    "Create development connection": "Создать подключение для разработки",
    "Foundation": "Основа",
    "Open integration →": "Открыть интеграцию →",
    "← Integrations": "← Интеграции",
    "These records are placeholders for future provider adapters. The external CRM remains the source of truth.":
      "Эти записи — заготовки для будущих адаптеров провайдеров. Внешняя CRM остаётся источником достоверных данных.",
    "New CRM connection": "Новое подключение CRM",
    "CRM connection deleted.": "Подключение CRM удалено.",
    "Provider: Custom placeholder": "Провайдер: тестовая заготовка",
    "Last sync:": "Последняя синхронизация:",
    "Never": "Никогда",
    "connected": "подключено",
    "disconnected": "отключено",
    "draft": "черновик",
    "error": "ошибка",
    "No CRM connections": "Нет подключений CRM",
    "Create a placeholder record to prepare the integration boundary.":
      "Создайте запись-заготовку для подготовки интеграционного слоя.",
    "← CRM connections": "← Подключения CRM",
    "Create a non-secret placeholder. This does not contact or connect to any real CRM provider.":
      "Создайте безопасную запись-заготовку. Она не обращается к реальному провайдеру CRM и не подключается к нему.",
    "Custom placeholder": "Тестовая заготовка",
    "Connection settings": "Настройки подключения",
    "Only controlled, non-secret placeholder configuration is stored.":
      "Хранятся только контролируемые несекретные настройки заготовки.",
    "Connection name": "Название подключения",
    "Primary CRM": "Основная CRM",
    "External workspace reference": "Идентификатор внешнего рабочего пространства",
    "Optional non-secret identifier. Never enter API keys, tokens, or passwords.":
      "Необязательный несекретный идентификатор. Никогда не вводите API-ключи, токены или пароли.",
    "Provider region": "Регион провайдера",
    "Not specified": "Не указан",
    "Global": "Глобальный",
    "Europe": "Европа",
    "United States": "США",
    "Asia Pacific": "Азиатско-Тихоокеанский регион",
    "Create placeholder connection": "Создать подключение-заготовку",
    "Save connection settings": "Сохранить настройки подключения",
    "Connection lifecycle": "Состояние подключения",
    "No real CRM adapter exists yet. Nexora will not mark this placeholder as connected without a verified provider response.":
      "Реального CRM-адаптера пока нет. Nexora не отметит заготовку подключённой без подтверждённого ответа провайдера.",
    "Connect provider — not available yet":
      "Подключить провайдера — пока недоступно",
    "Updating…": "Обновляем…",
    "Return to draft": "Вернуть в черновик",
    "Mark as disconnected": "Отметить отключённым",
    "Delete connection": "Удалить подключение",
    "This removes only this Nexora connection record. It does not modify any external CRM.":
      "Будет удалена только запись подключения в Nexora. Внешняя CRM не изменится.",
    "Deleting…": "Удаляем…",
    "Enter a valid email address.": "Введите корректный адрес электронной почты.",
    "Check the highlighted field.": "Проверьте выделенное поле.",
    "Enter your password.": "Введите пароль.",
    "Check the highlighted fields.": "Проверьте выделенные поля.",
    "Use 8 to 128 characters.": "Используйте от 8 до 128 символов.",
    "Confirm your password.": "Подтвердите пароль.",
    "Passwords do not match.": "Пароли не совпадают.",
    "If an account exists and email delivery is available, a password reset link is on its way. If you requested one recently, wait a few minutes before trying again.":
      "Если аккаунт существует и отправка почты доступна, ссылка для сброса пароля уже отправлена. Если вы недавно запрашивали её, подождите несколько минут.",
    "Sign in is temporarily unavailable. Try again.":
      "Вход временно недоступен. Попробуйте ещё раз.",
    "Email or password is incorrect.": "Неверная электронная почта или пароль.",
    "Unable to sign in. Try again.": "Не удалось войти. Попробуйте ещё раз.",
    "Account creation is temporarily unavailable.":
      "Создание аккаунта временно недоступно.",
    "Unable to create the account. Check your details or try again later.":
      "Не удалось создать аккаунт. Проверьте данные или попробуйте позже.",
    "Check your email to confirm your address and finish creating your account.":
      "Проверьте почту, подтвердите адрес и завершите создание аккаунта.",
    "This recovery session is invalid or expired. Request a new reset link.":
      "Сеанс восстановления недействителен или истёк. Запросите новую ссылку.",
    "Password update is temporarily unavailable.":
      "Обновление пароля временно недоступно.",
    "Unable to update the password. Request a new reset link and try again.":
      "Не удалось обновить пароль. Запросите новую ссылку и попробуйте ещё раз.",
    "Enter an organization name.": "Введите название организации.",
    "Organization name must be 100 characters or fewer.":
      "Название организации должно содержать не более 100 символов.",
    "Slug must be at least 3 characters.":
      "Адрес организации должен содержать не менее 3 символов.",
    "Slug must be 63 characters or fewer.":
      "Адрес организации должен содержать не более 63 символов.",
    "Use lowercase letters, numbers, and single hyphens.":
      "Используйте строчные латинские буквы, цифры и одиночные дефисы.",
    "Your session has expired. Sign in and try again.":
      "Сеанс истёк. Войдите и попробуйте ещё раз.",
    "This organization slug is already in use.":
      "Этот адрес организации уже используется.",
    "The organization could not be created. Try again later.":
      "Не удалось создать организацию. Попробуйте позже.",
    "The organization could not be updated. Try again later.":
      "Не удалось обновить организацию. Попробуйте позже.",
    "Organization not found or access was denied.":
      "Организация не найдена или доступ запрещён.",
    "Organization settings saved.": "Настройки организации сохранены.",
    "Email address is too long.": "Адрес электронной почты слишком длинный.",
    "An active invitation already exists, or this user is already a member.":
      "Активное приглашение уже существует или пользователь уже состоит в организации.",
    "The invitation could not be created. Check owner access and try again.":
      "Не удалось создать приглашение. Проверьте права владельца и попробуйте ещё раз.",
    "Invitation created. Copy this link now; it cannot be shown again.":
      "Приглашение создано. Скопируйте ссылку сейчас — повторно показать её нельзя.",
    "The invitation request is invalid.": "Некорректный запрос приглашения.",
    "The invitation could not be revoked. It may no longer be pending.":
      "Не удалось отозвать приглашение. Возможно, оно уже не ожидает принятия.",
    "Invitation revoked.": "Приглашение отозвано.",
    "The administrator request is invalid.":
      "Некорректный запрос управления администратором.",
    "The administrator could not be removed. Check owner access and try again.":
      "Не удалось удалить администратора. Проверьте права владельца и попробуйте ещё раз.",
    "Administrator removed.": "Администратор удалён.",
    "Invitation link is invalid.": "Ссылка-приглашение недействительна.",
    "Sign in or create an account before accepting.":
      "Войдите или создайте аккаунт перед принятием приглашения.",
    "This invitation is invalid, expired, revoked, already used, or belongs to another email.":
      "Приглашение недействительно, истекло, отозвано, уже использовано или предназначено для другого адреса.",
    "Enter a connection name.": "Введите название подключения.",
    "Connection name must be 100 characters or fewer.":
      "Название подключения должно содержать не более 100 символов.",
    "Workspace reference must be 100 characters or fewer.":
      "Идентификатор рабочего пространства должен содержать не более 100 символов.",
    "Use letters, numbers, underscores, or hyphens.":
      "Используйте латинские буквы, цифры, подчёркивания или дефисы.",
    "The CRM connection could not be created. Check organization access and try again.":
      "Не удалось создать подключение CRM. Проверьте доступ к организации и попробуйте ещё раз.",
    "The CRM connection could not be updated. Access may have been denied.":
      "Не удалось обновить подключение CRM. Возможно, доступ запрещён.",
    "Connection settings saved.": "Настройки подключения сохранены.",
    "The CRM connection request is invalid.":
      "Некорректный запрос подключения CRM.",
    "The CRM connection status could not be changed. Access may have been denied.":
      "Не удалось изменить состояние подключения CRM. Возможно, доступ запрещён.",
    "Connection marked as disconnected.":
      "Подключение отмечено как отключённое.",
    "Connection returned to draft.": "Подключение возвращено в черновик.",
    "The CRM connection could not be deleted. Access may have been denied.":
      "Не удалось удалить подключение CRM. Возможно, доступ запрещён.",
    "Connect": "Подключить",
    "Securely prepare a YCLIENTS connection. Official API access is required for verification.":
      "Безопасно подготовьте подключение YCLIENTS. Для проверки нужен официальный доступ к API.",
    "Set up YCLIENTS": "Настройка YCLIENTS",
    "Official YCLIENTS API credentials are required. This foundation stores credentials securely but cannot verify API access yet.":
      "Требуются официальные учётные данные API YCLIENTS. Эта основа безопасно хранит их, но пока не может проверить доступ к API.",
    "YCLIENTS company ID": "ID компании YCLIENTS",
    "This is the non-secret branch identifier from your YCLIENTS account.":
      "Это несекретный идентификатор филиала из аккаунта YCLIENTS.",
    "Create YCLIENTS connection": "Создать подключение YCLIENTS",
    "Enter the YCLIENTS company ID.": "Введите ID компании YCLIENTS.",
    "Company ID must be 32 digits or fewer.":
      "ID компании должен содержать не более 32 цифр.",
    "Company ID must contain digits only.":
      "ID компании должен содержать только цифры.",
    "The YCLIENTS connection could not be created. Check organization access and try again.":
      "Не удалось создать подключение YCLIENTS. Проверьте доступ к организации и повторите попытку.",
    "The YCLIENTS connection could not be updated. Access may have been denied.":
      "Не удалось обновить подключение YCLIENTS. Возможно, доступ запрещён.",
    "Only the non-secret company ID is stored with the connection. Tokens are stored separately in encrypted form.":
      "В подключении хранится только несекретный ID компании. Токены хранятся отдельно в зашифрованном виде.",
    "YCLIENTS credentials": "Учётные данные YCLIENTS",
    "Credentials saved": "Учётные данные сохранены",
    "Credentials saved.": "Учётные данные сохранены.",
    "Credentials required": "Нужны учётные данные",
    "Secrets are encrypted before storage and are never shown again. Saving new values replaces the previous credentials.":
      "Секреты шифруются перед сохранением и больше не отображаются. Новые значения заменяют прежние.",
    "Partner API token": "Партнёрский API-токен",
    "User token": "Токен пользователя",
    "Enter the complete token.": "Введите токен полностью.",
    "The token is too long.": "Токен слишком длинный.",
    "Save credentials": "Сохранить учётные данные",
    "Replace credentials": "Заменить учётные данные",
    "Credential encryption is not configured. Contact the administrator.":
      "Шифрование учётных данных не настроено. Обратитесь к администратору.",
    "Credentials could not be saved. Check organization access and try again.":
      "Не удалось сохранить учётные данные. Проверьте доступ к организации и повторите попытку.",
    "Test connection": "Проверить подключение",
    "Testing…": "Проверяем…",
    "Save YCLIENTS credentials before testing.":
      "Перед проверкой сохраните учётные данные YCLIENTS.",
    "Official YCLIENTS API access is required to test this connection.":
      "Для проверки подключения требуется официальный доступ к API YCLIENTS.",
    "The connection could not be tested. Access may have been denied.":
      "Не удалось проверить подключение. Возможно, доступ запрещён.",
    "Disconnect": "Отключить",
    "Disconnecting…": "Отключаем…",
    "The connection could not be disconnected. Access may have been denied.":
      "Не удалось отключить подключение. Возможно, доступ запрещён.",
    "Credentials deleted and connection disconnected.":
      "Учётные данные удалены, подключение отключено.",
    "Deleting this connection also permanently deletes its encrypted credentials.":
      "Удаление подключения также безвозвратно удалит зашифрованные учётные данные.",
    "Language": "Язык",
    "Русский": "Русский",
    "Қазақша": "Қазақша",
  },
  kk: {
    "AI Manager": "ЖИ-менеджер",
    "Authentication": "Аутентификация",
    "Sign in": "Кіру",
    "Get started": "Бастау",
    "Built around your existing systems": "Қолданыстағы жүйелеріңізбен жұмыс істейді",
    "An AI manager, not another CRM.": "Тағы бір CRM емес, ЖИ-менеджер.",
    "Nexora is designed to work on top of the CRM a business already trusts, connecting customer conversations with operational data without replacing the source of truth.":
      "Nexora бизнес сенетін CRM жүйесінің үстінде жұмыс істейді: негізгі дереккөзді алмастырмай, клиенттермен диалогтарды операциялық деректермен байланыстырады.",
    "Project foundation is ready": "Жоба негізі дайын",
    "Page not found": "Бет табылмады",
    "The requested page does not exist or you do not have access to it.":
      "Сұралған бет жоқ немесе оған кіруге рұқсатыңыз жоқ.",
    "Return to home": "Басты бетке оралу",
    "Use your email and password to continue to Nexora.":
      "Nexora-да жұмысты жалғастыру үшін электрондық поштаңыз бен құпиясөзіңізді енгізіңіз.",
    "New to Nexora?": "Nexora-ны алғаш рет қолданып тұрсыз ба?",
    "Create an account": "Тіркелгі жасау",
    "Welcome back": "Қайта оралғаныңызға қуаныштымыз",
    "The authentication link is invalid or expired. Try again.":
      "Аутентификация сілтемесі жарамсыз немесе мерзімі өткен. Қайталап көріңіз.",
    "Forgot your password?": "Құпиясөзді ұмыттыңыз ба?",
    "Create the account that will manage your Nexora access.":
      "Nexora-ға кіруді басқаратын тіркелгі жасаңыз.",
    "Already have an account?": "Тіркелгіңіз бар ма?",
    "Create your account": "Тіркелгі жасау",
    "Enter your email and we will send password reset instructions if the account exists.":
      "Электрондық поштаңызды енгізіңіз. Тіркелгі бар болса, құпиясөзді қалпына келтіру нұсқаулығын жібереміз.",
    "Return to sign in": "Кіру бетіне оралу",
    "Reset your password": "Құпиясөзді қалпына келтіру",
    "Choose a new password for your account.":
      "Тіркелгіңізге жаңа құпиясөз таңдаңыз.",
    "Update password": "Құпиясөзді жаңарту",
    "Send reset link": "Сілтемені жіберу",
    "Create account": "Тіркелгі жасау",
    "Please wait…": "Күте тұрыңыз…",
    "Email": "Электрондық пошта",
    "New password": "Жаңа құпиясөз",
    "Password": "Құпиясөз",
    "Confirm password": "Құпиясөзді растаңыз",
    "Signing out…": "Шығуда…",
    "Sign out": "Шығу",
    "Protected application": "Қорғалған қолданба",
    "Your password has been updated.": "Құпиясөз сәтті жаңартылды.",
    "Sign out could not be completed. Try again.":
      "Жүйеден шығу мүмкін болмады. Қайталап көріңіз.",
    "Organizations": "Ұйымдар",
    "Choose your organization": "Ұйымды таңдаңыз",
    "You are authenticated as": "Сіз мына пайдаланушы ретінде кірдіңіз:",
    "an authenticated user": "аутентификацияланған пайдаланушы",
    "You do not belong to an organization yet.":
      "Сіз әзірге ешбір ұйымға кірмейсіз.",
    "Create an organization": "Ұйым құру",
    "You will become its owner automatically.":
      "Сіз автоматты түрде оның иесі боласыз.",
    "Organization name": "Ұйым атауы",
    "Slug": "Ұйым мекенжайы",
    "Saving…": "Сақталуда…",
    "Create organization": "Ұйым құру",
    "Save settings": "Баптауларды сақтау",
    "Overview": "Шолу",
    "Integrations": "Интеграциялар",
    "Administrators": "Әкімшілер",
    "← All organizations": "← Барлық ұйымдар",
    "Organization workspace": "Ұйымның жұмыс кеңістігі",
    "owner": "иесі",
    "admin": "әкімші",
    "Workspace overview": "Жұмыс кеңістігіне шолу",
    "This page is loaded only after Supabase RLS and a server-side membership query authorize access.":
      "Бұл бетке кіру Supabase RLS саясаттары және мүшелікті серверлік тексеру арқылы расталғаннан кейін ғана жүктеледі.",
    "Organization settings": "Ұйым баптаулары",
    "Owners and admins may update operational organization fields.":
      "Иесі мен әкімшілер ұйымның жұмыс деректерін өзгерте алады.",
    "Owner settings": "Иесі баптаулары",
    "Invite administrators with a one-time link and remove active administrators. Only organization owners can access this page.":
      "Әкімшілерді бір реттік сілтемемен шақырып, белсенді әкімшілерді жойыңыз. Бұл бет тек ұйым иесіне қолжетімді.",
    "Administrator settings could not be loaded. Try again later.":
      "Әкімші баптауларын жүктеу мүмкін болмады. Кейінірек қайталап көріңіз.",
    "Invite an administrator": "Әкімшіні шақыру",
    "The link expires after seven days. Nexora stores only its cryptographic hash, so copy it immediately.":
      "Сілтеме жеті күн жарамды. Nexora оның криптографиялық хешін ғана сақтайды, сондықтан бірден көшіріп алыңыз.",
    "Active administrators": "Белсенді әкімшілер",
    "Added": "Қосылды",
    "No active administrators.": "Белсенді әкімшілер жоқ.",
    "Invitation history": "Шақырулар тарихы",
    "Expires": "Мерзімі:",
    "Created": "Жасалды",
    "pending": "күтуде",
    "accepted": "қабылданды",
    "expired": "мерзімі өтті",
    "revoked": "қайтарылды",
    "No invitations have been created.": "Шақырулар әлі жасалмаған.",
    "Administrator email": "Әкімшінің электрондық поштасы",
    "One-time invitation link": "Бір реттік шақыру сілтемесі",
    "Copied": "Көшірілді",
    "Copy link": "Сілтемені көшіру",
    "Creating…": "Жасалуда…",
    "Create invitation": "Шақыру жасау",
    "Working…": "Орындалуда…",
    "Revoke": "Қайтарып алу",
    "Remove": "Жою",
    "Invitation unavailable": "Шақыру қолжетімсіз",
    "This invitation link is invalid. Ask the organization owner for a new link.":
      "Бұл шақыру сілтемесі жарамсыз. Ұйым иесінен жаңа сілтеме сұраңыз.",
    "Administrator invitation": "Әкімші шақыруы",
    "Join an organization in Nexora": "Nexora ұйымына қосылу",
    "Sign in or create an account with the exact email address that received this invitation.":
      "Шақыру жіберілген электрондық пошта мекенжайымен кіріңіз немесе тіркелгі жасаңыз.",
    "Signed in as": "Сіз мына пайдаланушы ретінде кірдіңіз:",
    "The invitation can be accepted only if this email matches.":
      "Шақыруды электрондық пошта мекенжайы сәйкес келгенде ғана қабылдауға болады.",
    "Accepting…": "Қабылдануда…",
    "Accept administrator invitation": "Әкімші шақыруын қабылдау",
    "Connect Nexora to external systems without copying their operational data into this workspace.":
      "Операциялық деректерді осы жұмыс кеңістігіне көшірмей, Nexora-ны сыртқы жүйелерге қосыңыз.",
    "Create and manage provider-neutral CRM connection metadata. A real CRM adapter has not been selected or implemented.":
      "Провайдерге тәуелсіз CRM қосылымдарын жасаңыз және басқарыңыз. Нақты CRM адаптері әлі таңдалмаған және іске асырылмаған.",
    "CRM connections": "CRM қосылымдары",
    "Your CRM connections": "CRM қосылымдарыңыз",
    "Manage the CRM connections available to this organization. The external CRM remains the source of truth.":
      "Осы ұйымның CRM қосылымдарын басқарыңыз. Сыртқы CRM негізгі дереккөз болып қалады.",
    "Provider:": "Провайдер:",
    "Edit": "Өзгерту",
    "No connections yet": "Қосылымдар әлі жоқ",
    "Choose the development connection below to prepare the integration boundary.":
      "Интеграция қабатын дайындау үшін төмендегі әзірлеу қосылымын таңдаңыз.",
    "Connect a new CRM": "Жаңа CRM қосу",
    "Choose a provider. Production integrations will become available after their adapters are implemented and verified.":
      "Провайдерді таңдаңыз. Жұмыс интеграциялары адаптерлері іске асырылып, тексерілгеннен кейін қолжетімді болады.",
    "Official integration": "Ресми интеграция",
    "Coming soon": "Жақында",
    "YCLIENTS integration is planned and cannot be connected yet.":
      "YCLIENTS интеграциясы жоспарланған, бірақ әзірге қосу мүмкін емес.",
    "Altegio integration is planned and cannot be connected yet.":
      "Altegio интеграциясы жоспарланған, бірақ әзірге қосу мүмкін емес.",
    "Configure": "Баптау",
    "Development only": "Тек әзірлеуге арналған",
    "Development connection": "Әзірлеу қосылымы",
    "Create a non-secret test connection for developing the integration foundation.":
      "Интеграция негізін әзірлеу үшін құпия деректерсіз сынақ қосылымын жасаңыз.",
    "Development CRM connection": "Әзірлеуге арналған CRM қосылымы",
    "Create a non-secret development connection. This does not contact or connect to any real CRM provider.":
      "Құпия деректерсіз әзірлеу қосылымын жасаңыз. Ол нақты CRM провайдеріне хабарласпайды және қосылмайды.",
    "Workspace reference (optional)":
      "Жұмыс кеңістігінің идентификаторы (міндетті емес)",
    "Create development connection": "Әзірлеу қосылымын жасау",
    "Foundation": "Негіз",
    "Open integration →": "Интеграцияны ашу →",
    "← Integrations": "← Интеграциялар",
    "These records are placeholders for future provider adapters. The external CRM remains the source of truth.":
      "Бұл жазбалар болашақ провайдер адаптерлеріне арналған. Сыртқы CRM негізгі дереккөз болып қалады.",
    "New CRM connection": "Жаңа CRM қосылымы",
    "CRM connection deleted.": "CRM қосылымы жойылды.",
    "Provider: Custom placeholder": "Провайдер: сынақ үлгісі",
    "Last sync:": "Соңғы синхрондау:",
    "Never": "Ешқашан",
    "connected": "қосылған",
    "disconnected": "ажыратылған",
    "draft": "жоба",
    "error": "қате",
    "No CRM connections": "CRM қосылымдары жоқ",
    "Create a placeholder record to prepare the integration boundary.":
      "Интеграция қабатын дайындау үшін үлгі жазба жасаңыз.",
    "← CRM connections": "← CRM қосылымдары",
    "Create a non-secret placeholder. This does not contact or connect to any real CRM provider.":
      "Құпия дерексіз үлгі жасаңыз. Ол нақты CRM провайдеріне хабарласпайды және қосылмайды.",
    "Custom placeholder": "Сынақ үлгісі",
    "Connection settings": "Қосылым баптаулары",
    "Only controlled, non-secret placeholder configuration is stored.":
      "Тек бақыланатын, құпия емес үлгі баптаулары сақталады.",
    "Connection name": "Қосылым атауы",
    "Primary CRM": "Негізгі CRM",
    "External workspace reference": "Сыртқы жұмыс кеңістігінің идентификаторы",
    "Optional non-secret identifier. Never enter API keys, tokens, or passwords.":
      "Міндетті емес құпия емес идентификатор. API кілттерін, токендерді немесе құпиясөздерді ешқашан енгізбеңіз.",
    "Provider region": "Провайдер аймағы",
    "Not specified": "Көрсетілмеген",
    "Global": "Жаһандық",
    "Europe": "Еуропа",
    "United States": "АҚШ",
    "Asia Pacific": "Азия-Тынық мұхиты",
    "Create placeholder connection": "Үлгі қосылымын жасау",
    "Save connection settings": "Қосылым баптауларын сақтау",
    "Connection lifecycle": "Қосылым күйі",
    "No real CRM adapter exists yet. Nexora will not mark this placeholder as connected without a verified provider response.":
      "Нақты CRM адаптері әлі жоқ. Nexora провайдердің расталған жауабынсыз бұл үлгіні қосылған деп белгілемейді.",
    "Connect provider — not available yet":
      "Провайдерді қосу — әзірге қолжетімсіз",
    "Updating…": "Жаңартылуда…",
    "Return to draft": "Жоба күйіне қайтару",
    "Mark as disconnected": "Ажыратылған деп белгілеу",
    "Delete connection": "Қосылымды жою",
    "This removes only this Nexora connection record. It does not modify any external CRM.":
      "Тек Nexora-дағы осы қосылым жазбасы жойылады. Сыртқы CRM өзгермейді.",
    "Deleting…": "Жойылуда…",
    "Enter a valid email address.": "Жарамды электрондық пошта мекенжайын енгізіңіз.",
    "Check the highlighted field.": "Белгіленген өрісті тексеріңіз.",
    "Enter your password.": "Құпиясөзді енгізіңіз.",
    "Check the highlighted fields.": "Белгіленген өрістерді тексеріңіз.",
    "Use 8 to 128 characters.": "8-ден 128-ге дейін таңба қолданыңыз.",
    "Confirm your password.": "Құпиясөзді растаңыз.",
    "Passwords do not match.": "Құпиясөздер сәйкес келмейді.",
    "If an account exists and email delivery is available, a password reset link is on its way. If you requested one recently, wait a few minutes before trying again.":
      "Тіркелгі бар және пошта жіберу қолжетімді болса, құпиясөзді қалпына келтіру сілтемесі жіберілді. Жақында сұратсаңыз, бірнеше минут күтіңіз.",
    "Sign in is temporarily unavailable. Try again.":
      "Кіру уақытша қолжетімсіз. Қайталап көріңіз.",
    "Email or password is incorrect.":
      "Электрондық пошта немесе құпиясөз қате.",
    "Unable to sign in. Try again.":
      "Кіру мүмкін болмады. Қайталап көріңіз.",
    "Account creation is temporarily unavailable.":
      "Тіркелгі жасау уақытша қолжетімсіз.",
    "Unable to create the account. Check your details or try again later.":
      "Тіркелгіні жасау мүмкін болмады. Деректерді тексеріңіз немесе кейінірек қайталап көріңіз.",
    "Check your email to confirm your address and finish creating your account.":
      "Поштаңызды тексеріп, мекенжайды растаңыз және тіркелгі жасауды аяқтаңыз.",
    "This recovery session is invalid or expired. Request a new reset link.":
      "Қалпына келтіру сеансы жарамсыз немесе мерзімі өткен. Жаңа сілтеме сұратыңыз.",
    "Password update is temporarily unavailable.":
      "Құпиясөзді жаңарту уақытша қолжетімсіз.",
    "Unable to update the password. Request a new reset link and try again.":
      "Құпиясөзді жаңарту мүмкін болмады. Жаңа сілтеме сұратып, қайталап көріңіз.",
    "Enter an organization name.": "Ұйым атауын енгізіңіз.",
    "Organization name must be 100 characters or fewer.":
      "Ұйым атауы 100 таңбадан аспауы керек.",
    "Slug must be at least 3 characters.":
      "Ұйым мекенжайы кемінде 3 таңбадан тұруы керек.",
    "Slug must be 63 characters or fewer.":
      "Ұйым мекенжайы 63 таңбадан аспауы керек.",
    "Use lowercase letters, numbers, and single hyphens.":
      "Кіші латын әріптерін, сандарды және дара дефистерді қолданыңыз.",
    "Your session has expired. Sign in and try again.":
      "Сеанс мерзімі аяқталды. Кіріп, қайталап көріңіз.",
    "This organization slug is already in use.":
      "Бұл ұйым мекенжайы қолданыста.",
    "The organization could not be created. Try again later.":
      "Ұйымды құру мүмкін болмады. Кейінірек қайталап көріңіз.",
    "The organization could not be updated. Try again later.":
      "Ұйымды жаңарту мүмкін болмады. Кейінірек қайталап көріңіз.",
    "Organization not found or access was denied.":
      "Ұйым табылмады немесе кіруге тыйым салынды.",
    "Organization settings saved.": "Ұйым баптаулары сақталды.",
    "Email address is too long.": "Электрондық пошта мекенжайы тым ұзын.",
    "An active invitation already exists, or this user is already a member.":
      "Белсенді шақыру бар немесе пайдаланушы ұйымның мүшесі.",
    "The invitation could not be created. Check owner access and try again.":
      "Шақыруды жасау мүмкін болмады. Иесінің құқығын тексеріп, қайталап көріңіз.",
    "Invitation created. Copy this link now; it cannot be shown again.":
      "Шақыру жасалды. Сілтемені қазір көшіріңіз — оны қайта көрсету мүмкін емес.",
    "The invitation request is invalid.": "Шақыру сұрауы жарамсыз.",
    "The invitation could not be revoked. It may no longer be pending.":
      "Шақыруды қайтарып алу мүмкін болмады. Ол енді күту күйінде болмауы мүмкін.",
    "Invitation revoked.": "Шақыру қайтарылды.",
    "The administrator request is invalid.": "Әкімші сұрауы жарамсыз.",
    "The administrator could not be removed. Check owner access and try again.":
      "Әкімшіні жою мүмкін болмады. Иесінің құқығын тексеріп, қайталап көріңіз.",
    "Administrator removed.": "Әкімші жойылды.",
    "Invitation link is invalid.": "Шақыру сілтемесі жарамсыз.",
    "Sign in or create an account before accepting.":
      "Шақыруды қабылдамас бұрын кіріңіз немесе тіркелгі жасаңыз.",
    "This invitation is invalid, expired, revoked, already used, or belongs to another email.":
      "Шақыру жарамсыз, мерзімі өткен, қайтарылған, қолданылған немесе басқа электрондық поштаға арналған.",
    "Enter a connection name.": "Қосылым атауын енгізіңіз.",
    "Connection name must be 100 characters or fewer.":
      "Қосылым атауы 100 таңбадан аспауы керек.",
    "Workspace reference must be 100 characters or fewer.":
      "Жұмыс кеңістігінің идентификаторы 100 таңбадан аспауы керек.",
    "Use letters, numbers, underscores, or hyphens.":
      "Латын әріптерін, сандарды, астын сызу немесе дефис таңбаларын қолданыңыз.",
    "The CRM connection could not be created. Check organization access and try again.":
      "CRM қосылымын жасау мүмкін болмады. Ұйымға кіруді тексеріп, қайталап көріңіз.",
    "The CRM connection could not be updated. Access may have been denied.":
      "CRM қосылымын жаңарту мүмкін болмады. Кіруге тыйым салынуы мүмкін.",
    "Connection settings saved.": "Қосылым баптаулары сақталды.",
    "The CRM connection request is invalid.": "CRM қосылым сұрауы жарамсыз.",
    "The CRM connection status could not be changed. Access may have been denied.":
      "CRM қосылым күйін өзгерту мүмкін болмады. Кіруге тыйым салынуы мүмкін.",
    "Connection marked as disconnected.":
      "Қосылым ажыратылған деп белгіленді.",
    "Connection returned to draft.": "Қосылым жоба күйіне қайтарылды.",
    "The CRM connection could not be deleted. Access may have been denied.":
      "CRM қосылымын жою мүмкін болмады. Кіруге тыйым салынуы мүмкін.",
    "Connect": "Қосу",
    "Securely prepare a YCLIENTS connection. Official API access is required for verification.":
      "YCLIENTS қосылымын қауіпсіз дайындаңыз. Тексеру үшін ресми API рұқсаты қажет.",
    "Set up YCLIENTS": "YCLIENTS баптау",
    "Official YCLIENTS API credentials are required. This foundation stores credentials securely but cannot verify API access yet.":
      "YCLIENTS ресми API тіркелгі деректері қажет. Бұл негіз оларды қауіпсіз сақтайды, бірақ API рұқсатын әзірге тексере алмайды.",
    "YCLIENTS company ID": "YCLIENTS компания ID-і",
    "This is the non-secret branch identifier from your YCLIENTS account.":
      "Бұл YCLIENTS аккаунтындағы құпия емес филиал идентификаторы.",
    "Create YCLIENTS connection": "YCLIENTS қосылымын жасау",
    "Enter the YCLIENTS company ID.": "YCLIENTS компания ID-ін енгізіңіз.",
    "Company ID must be 32 digits or fewer.":
      "Компания ID-і 32 цифрдан аспауы керек.",
    "Company ID must contain digits only.":
      "Компания ID-інде тек цифрлар болуы керек.",
    "The YCLIENTS connection could not be created. Check organization access and try again.":
      "YCLIENTS қосылымын жасау мүмкін болмады. Ұйымға кіру құқығын тексеріп, қайталап көріңіз.",
    "The YCLIENTS connection could not be updated. Access may have been denied.":
      "YCLIENTS қосылымын жаңарту мүмкін болмады. Кіруге тыйым салынуы мүмкін.",
    "Only the non-secret company ID is stored with the connection. Tokens are stored separately in encrypted form.":
      "Қосылымда тек құпия емес компания ID-і сақталады. Токендер бөлек шифрланған түрде сақталады.",
    "YCLIENTS credentials": "YCLIENTS тіркелгі деректері",
    "Credentials saved": "Тіркелгі деректері сақталды",
    "Credentials saved.": "Тіркелгі деректері сақталды.",
    "Credentials required": "Тіркелгі деректері қажет",
    "Secrets are encrypted before storage and are never shown again. Saving new values replaces the previous credentials.":
      "Құпиялар сақтау алдында шифрланады және қайта көрсетілмейді. Жаңа мәндер бұрынғыларын ауыстырады.",
    "Partner API token": "Серіктестік API токені",
    "User token": "Пайдаланушы токені",
    "Enter the complete token.": "Токенді толығымен енгізіңіз.",
    "The token is too long.": "Токен тым ұзын.",
    "Save credentials": "Тіркелгі деректерін сақтау",
    "Replace credentials": "Тіркелгі деректерін ауыстыру",
    "Credential encryption is not configured. Contact the administrator.":
      "Тіркелгі деректерін шифрлау бапталмаған. Әкімшіге хабарласыңыз.",
    "Credentials could not be saved. Check organization access and try again.":
      "Тіркелгі деректерін сақтау мүмкін болмады. Ұйымға кіру құқығын тексеріп, қайталап көріңіз.",
    "Test connection": "Қосылымды тексеру",
    "Testing…": "Тексерілуде…",
    "Save YCLIENTS credentials before testing.":
      "Тексеру алдында YCLIENTS тіркелгі деректерін сақтаңыз.",
    "Official YCLIENTS API access is required to test this connection.":
      "Қосылымды тексеру үшін YCLIENTS ресми API рұқсаты қажет.",
    "The connection could not be tested. Access may have been denied.":
      "Қосылымды тексеру мүмкін болмады. Кіруге тыйым салынуы мүмкін.",
    "Disconnect": "Ажырату",
    "Disconnecting…": "Ажыратылуда…",
    "The connection could not be disconnected. Access may have been denied.":
      "Қосылымды ажырату мүмкін болмады. Кіруге тыйым салынуы мүмкін.",
    "Credentials deleted and connection disconnected.":
      "Тіркелгі деректері жойылып, қосылым ажыратылды.",
    "Deleting this connection also permanently deletes its encrypted credentials.":
      "Бұл қосылымды жою оның шифрланған тіркелгі деректерін де біржола жояды.",
    "Language": "Тіл",
    "Русский": "Орысша",
    "Қазақша": "Қазақша",
  },
};

export function translate(locale: Locale, key: string): string {
  return translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}
